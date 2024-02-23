console.clear = () => console.log('Console was cleared')
Object.defineProperty(navigator, "language", {
    get: function() {
        return "en-US";
    }
});
Object.defineProperty(navigator, "languages", {
    get: function() {
        return ["en-US", "en"];
    }
});
const i = setInterval(() => {
    if (window.turnstile) {
        clearInterval(i)
        window.turnstile.render = (a, b) => {
            let params = {
                captcha: "cloudflareTurnstile",
                sitekey: b.sitekey,
                pageurl: window.location.href,
                data: b.cData,
                pagedata: b.chlPageData,
                action: b.action,
                userAgent: navigator.userAgent,
                json: 1
            }
            console.log('intercepted-params:' + JSON.stringify(params))
            window.cfCallback = b.callback
            return
        }
    }

    yaSiteKey = document
            .querySelector("#captcha-container")
            .getAttribute("data-sitekey");

    if (yaSiteKey) {
        clearInterval(i)
        let params = {
            captcha: "yandexSmart",
            sitekey: yaSiteKey,
            pageurl: window.location.href,
        }
        console.log('intercepted-params:' + JSON.stringify(params))
        return
    }
}, 50)