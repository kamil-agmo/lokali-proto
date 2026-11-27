/* Notice banner: buttons with data-c-dismiss hide the banner. */
document.addEventListener('click', function (e) { var b = e.target.closest('.c-banner [data-c-dismiss]'); if (b) b.closest('.c-banner').hidden = true; });
