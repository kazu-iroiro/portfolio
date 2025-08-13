// GASのURL指定
const GAS_URL = "https://script.google.com/macros/s/AKfycbz4hkJ7gj21TEboWNebQxqPDlAKO5oCVfkQPJ9HCJ7nI90zFKtwyhI_qZchXVADVK5J/exec";

// URLクエリから cardver を取得
function getCardVer() {
    const params = new URLSearchParams(window.location.search);
    let verData = params.get("cardver");
    params.delete("cardver");
    window.history.replaceState({}, '', params.pathname);
    return verData;
}

// バージョン名をGASに投げる
(async () => {
    const cardver = getCardVer();

    if (!cardver) {
        console.log("cardver パラメータがURLに存在しません");
        return;
    }

    try {
        const url = `${GAS_URL}?param=${encodeURIComponent(cardver)}`;
        const res = await fetch(url, { method: "GET", mode: "cors" });
        const data = await res.json();
        console.log("API response:", data);
    } catch (err) {
        console.error("Error:", err);
    }
})();


document.addEventListener("DOMContentLoaded", function () {
    function checkOverflow() {
        const header = document.getElementById("header");
        const leftcontent = document.getElementById("leftBox");
        const rightcontent = document.getElementById("rightBox");

        if (!header) return;
        if (!leftcontent) return;
        if (header.offsetHeight + leftcontent.offsetHeight > window.innerHeight) {
            leftcontent.classList.add("overflowLeftBox");
            rightcontent.classList.add("overflowRightBox");
            rightcontent.classList.remove("rightBox");

        } else {
            leftcontent.classList.remove("overflowLeftBox");
            rightcontent.classList.remove("overflowRightBox");
            rightcontent.classList.add("rightBox");

        }
    }

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
});