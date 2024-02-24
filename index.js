const bs = require("browser-sync").create();

bs.init({
    server: "./docs"
});

bs.watch('./public/*.html,./public/*.js').on('change', bs.reload);