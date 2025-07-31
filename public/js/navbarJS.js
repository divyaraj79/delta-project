const searchInput = document.querySelector(".search-input");
  const autocompleteList = document.querySelector("#autocomplete-list");

  if (searchInput && autocompleteList) {
  searchInput.addEventListener("input", async () => {
    const query = searchInput.value.trim();

    if (!query) {
      autocompleteList.style.display = "none";
      autocompleteList.innerHTML = "";
      return;
    }

    const res = await fetch(`/listings/autocomplete?q=${encodeURIComponent(query)}`);
    const listings = await res.json();

    if (listings.length === 0) {
      autocompleteList.style.display = "none";
      autocompleteList.innerHTML = "";
      return;
    }

    autocompleteList.innerHTML = "";
    listings.forEach(listing => {
      const li = document.createElement("li");
      li.classList.add("list-group-item", "list-group-item-action");
      li.textContent = `${listing.title} – ${listing.location}, ${listing.country}`;
      li.addEventListener("click", () => {
        searchInput.value = `${listing.title} – ${listing.location}, ${listing.country}`;
        autocompleteList.innerHTML = "";
        autocompleteList.style.display = "none";
      });
      autocompleteList.appendChild(li);
    });

    autocompleteList.style.display = "block";
  });

  // Hide list when clicking outside
  document.addEventListener("click", (e) => {
    if (!document.querySelector(".search-container").contains(e.target)) {
      autocompleteList.innerHTML = "";
      autocompleteList.style.display = "none";
    }
  });
}