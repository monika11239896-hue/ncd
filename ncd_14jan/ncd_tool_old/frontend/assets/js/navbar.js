document.addEventListener("DOMContentLoaded", () => {
    loadNavbar();
    loadPage("metadata"); // default page
});

function loadNavbar() {
    fetch("/navbar.html")
        .then(res => res.text())
        .then(html => {
            document.getElementById("navbar").innerHTML = html;
        });
}

function loadPage(page) {
    fetch(`/${page}.html`)
        .then(res => res.text())
        .then(html => {
            document.getElementById("content").innerHTML = html;
        })
        .catch(() => {
            document.getElementById("content").innerHTML = "<h3>Page not found</h3>";
        });
}
