// tiny hash router for single-page
const routes = [...document.querySelectorAll('[data-route]')]
const setRoute = ()=>{
	const id = location.hash.replace('#','') || 'home'
	routes.forEach(el=>el.classList.toggle('active', el.id===id))
	// scroll to top on route change
	window.scrollTo({top:0,behavior:'instant'})
}
window.addEventListener('hashchange', setRoute)
window.addEventListener('DOMContentLoaded', setRoute)