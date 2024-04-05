const API_BASE = "https://www.thecocktaildb.com/api/json/v1/1";

document.addEventListener("DOMContentLoaded", init);

function init() {
  let currentSelected = null;
  let currentPage = "home";
  const resultsContainer = document.querySelector(".results");
  const dialog = document.getElementById("dialog");
  const searchField = document.getElementById("search");

  const loader = {
    el: document.getElementById("loader"),
    show: function () {
      this.el.style.display = "block";
      this.isLoading = true;
    },
    hide: function () {
      this.el.style.display = "none";
      this.isLoading = false;
    },
    isLoading: false,
  };

  const storage = {
    KEY: "dzhe0001-com.cocktails-saved",
    getAll: function () {
      let data = localStorage.getItem(this.KEY);

      if (!data) return [];

      try {
        data = JSON.parse(data);

        if (!Array.isArray(data)) return [];
      } catch (err) {
        return [];
      }

      return data;
    },
    findOne: function (id) {
      const data = this.getAll();

      return data.find((item) => item.idDrink == id);
    },
    save: function (data) {
      if (!Array.isArray(data)) return;

      localStorage.setItem(this.KEY, JSON.stringify(data));
    },
    add: function () {
      if (this.findOne(currentSelected.idDrink)) return;

      const data = this.getAll();
      data.push({
        idDrink: currentSelected.idDrink,
        strDrink: currentSelected.strDrink,
        strDrinkThumb: currentSelected.strDrinkThumb,
      });

      this.save(data);
    },
    remove: function () {
      const data = this.getAll().filter(
        (item) => item.idDrink != currentSelected.idDrink
      );

      this.save(data);
    },
  };

  const title = {
    el: document.querySelector(".currentPage"),
    home: function () {
      this.el.style.display = "block";
      this.el.textContent = "Search Results 👀";
    },
    saved: function () {
      this.el.style.display = "block";
      this.el.textContent = "Your favorites 🥰";
    },
    hide: function () {
      this.el.style.display = "none";
    },
  }

  document.getElementById("search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    currentPage = "home";
    performSearch();
  });

  document.getElementById("savedBtn").addEventListener("click", () => {
    searchField.value = "";
    currentPage = "saved";
    loadStorage();
  });

  resultsContainer.addEventListener("click", showDetails);

  dialog.addEventListener("click", (e) => {
    if (e.target.id === "dialog" || e.target.classList.contains("close")) {
      return dialog.close();
    }

    if (e.target.classList.contains("save")) {
      e.target.style.display = "none";
      e.currentTarget.querySelector(".btn.remove").style.display = "block";

      return storage.add();
    }

    if (e.target.classList.contains("remove")) {
      e.target.style.display = "none";
      e.currentTarget.querySelector(".btn.save").style.display = "block";
      storage.remove();

      if (currentPage === "saved") {
        loadStorage();
        dialog.close();
      }
    }
  });

  async function performSearch() {
    const slug = searchField.value.trim();

    if (slug.length === 0) {
      title.hide();
      return genError(
        "We don't serve void today 🙄",
        "Input field can not be empty"
      );
    }

    const data = await customFetch(`/search.php?s=${slug}`);

    title.home();

    drawCocktails(data ? data.drinks : []);
  }

  function loadStorage(slug) {
    let data = storage.getAll();

    if (data.length === 0) {
      title.hide();
      return genError(
        "You haven't added anything to your favourites yet 🫠",
        "Use search to find something",
        true
      );
    }

    title.saved();

    drawCocktails(data);
  }

  async function customFetch(path) {
    loader.show();

    return await fetch(`${API_BASE}${path}`)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(resp.status);
        }

        loader.hide();
        return resp.json();
      })
      .then((data) => data)
      .catch((err) => {
        loader.hide();
        genError("An error occured 🥴", err);
      });
  }

  function drawCocktails(data) {
    if (!data || data.length === 0) {
      return genError("No drinks were found 😰", null, true);
    }

    const df = new DocumentFragment();

    data.forEach((item) => {
      const btn = document.createElement("button");

      btn.type = "button";
      btn.className = "cocktail";
      btn.setAttribute("data-id", item.idDrink);
      btn.style.background = `url(${item.strDrinkThumb}) no-repeat center center/cover`;
      btn.innerHTML = `<span>${item.strDrink}</span>`;

      df.append(btn);
    });

    resultsContainer.innerHTML = "";
    resultsContainer.append(df);
  }

  function genError(msg = "An error occured", subtitle = null, warn = false) {
    resultsContainer.innerHTML = `<p class="error${
      warn ? " warn" : ""
    }">${msg}${subtitle ? `<span>(${subtitle})</span>` : ""}</p>`;
  }

  async function showDetails(e) {
    if (loader.isLoading) {
      return;
    }

    const target = e.target;

    if (!target.classList.contains("cocktail")) {
      return;
    }

    const id = target.getAttribute("data-id");

    if (!id) {
      return;
    }

    const data = await customFetch(`/lookup.php?i=${id}`);

    if (!data || !data.drinks || data.drinks.length > 1) {
      return genError("We didn't manage to load the recipe 😭");
    }

    currentSelected = data.drinks[0];

    const container = dialog.querySelector(".dialog__content");
    container.innerHTML = `<div class="image">
        <img
          src="${currentSelected.strDrinkThumb}"
          alt="${currentSelected.strDrinkThumb}"
        />
      </div>
      <p class="tutorial">${currentSelected.strInstructions}</p>`;

    if (storage.findOne(id)) {
      dialog.querySelector(".btn.save").style.display = "none";
      dialog.querySelector(".btn.remove").style.display = "block";
    } else {
      dialog.querySelector(".btn.save").style.display = "block";
      dialog.querySelector(".btn.remove").style.display = "none";
    }

    dialog.showModal();
  }
}
