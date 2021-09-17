const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

require("dotenv").config({ path: "./.env" });

app.use("/bootstrap", express.static("node_modules/bootstrap/dist"));
app.use("/images", express.static("images/"));
app.set("view engine", "ejs");

var bcryptjs = require("bcryptjs");

const session = require("express-session");
app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
}));

const connection = require("./db");

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;

    var hash = await bcryptjs.hash(pass, 8);

    connection.query("INSERT INTO links SET ?", { user: user, pass: hash });
    res.render("login", {
        alert: true,
        icon: "success",
        title: "Registered",
        timer: 1500,
        url: "/"
    });
});

app.post("/login", async (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;

    if(pass)
    {
        connection.query("SELECT * FROM links WHERE user = ?", [user], async (error, result) => {
            if(result.length != 0)
            {
                if(await bcryptjs.compare(pass, result[0].pass))
                {
                    req.session.log = true;
                    req.session.user = result[0].user;
                    res.render("login", {
                        alert: true,
                        icon: "success",
                        title: "Correct Credentials",
                        timer: 1500,
                        url: "/"
                    });
                }
                else
                {
                    res.render("login", {
                        role: true,
                        error: "Incorrect Credentials"
                    });
                }
            }
            else
            {
                res.render("login", {
                    role: true,
                    error: "Incorrect Credentials"
                });
            }
        });
    }
});

app.get("/", (req, res) => {
    if(req.session.log)
    {
        res.render("index", {
            login: true,
            user: req.session.user
        });
    }
    else
    {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

app.set("port", process.env.PORT || 3000);

app.listen(app.get("port"), () => {
    console.log("App listening");
});