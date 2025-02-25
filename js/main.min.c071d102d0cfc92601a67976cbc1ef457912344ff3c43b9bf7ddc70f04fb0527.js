document.addEventListener("DOMContentLoaded",()=>{const t=document.querySelector(".nav-menu"),e=document.createElement("button");e.classList.add("nav-toggle"),e.setAttribute("aria-label","Toggle navigation menu"),e.innerHTML=`
        <span class="hamburger">
            <span></span>
            <span></span>
            <span></span>
        </span>
    `,e.addEventListener("click",()=>{t.classList.toggle("active"),e.classList.toggle("active")}),document.querySelector(".nav").insertBefore(e,t)}),document.querySelectorAll('a[href^="#"]').forEach(e=>{e.addEventListener("click",function(e){e.preventDefault();const t=document.querySelector(this.getAttribute("href"));t&&t.scrollIntoView({behavior:"smooth"})})});const currentPath=window.location.pathname;document.querySelectorAll(".nav-menu a").forEach(e=>{e.getAttribute("href")===currentPath&&e.classList.add("active")});const darkModeToggle=document.querySelector(".dark-mode-toggle");darkModeToggle&&(darkModeToggle.addEventListener("click",()=>{document.documentElement.classList.toggle("dark");const e=document.documentElement.classList.contains("dark");localStorage.setItem("darkMode",e?"dark":"light")}),localStorage.getItem("darkMode")==="dark"&&document.documentElement.classList.add("dark"));const searchInput=document.querySelector(".search-input");searchInput&&searchInput.addEventListener("input",async e=>{const t=e.target.value.toLowerCase();if(t.length<2)return;try{const e=await fetch("/index.json"),n=await e.json(),s=n.filter(e=>e.title.toLowerCase().includes(t)||e.description.toLowerCase().includes(t));displaySearchResults(s)}catch(e){console.error("Error fetching search results:",e)}});function displaySearchResults(e){const t=document.querySelector(".search-results");if(!t)return;t.innerHTML=e.map(e=>`
        <a href="${e.permalink}" class="search-result">
            <h3>${e.title}</h3>
            <p>${e.description}</p>
        </a>
    `).join("")}const animatedElements=document.querySelectorAll(".animate-on-scroll"),observer=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&e.target.classList.add("animate")})},{threshold:.1});animatedElements.forEach(e=>observer.observe(e))