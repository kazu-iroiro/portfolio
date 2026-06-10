// GASのURL指定
const GAS_URL = "https://script.google.com/macros/s/AKfycbz4hkJ7gj21TEboWNebQxqPDlAKO5oCVfkQPJ9HCJ7nI90zFKtwyhI_qZchXVADVK5J/exec";

// URLクエリから cardver を取得
function getCardVer() {
    const params = new URLSearchParams(window.location.search);
    return params.get("cardver");
}

// バージョン名をGASに投げる
(async () => {
    const cardver = getCardVer();

    if (!cardver) {
        console.log("cardver パラメータがURLに存在しません");
        return;
    } else {
        const pageUrl = new URL(window.location.href);
        pageUrl.searchParams.delete("cardver");
        history.replaceState('', '', pageUrl.toString());
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


class Carousel {
    constructor(containerId, trackId, items) {
        this.container = document.getElementById(containerId);
        this.track = document.getElementById(trackId);
        this.carouselWrapper = this.container.parentElement;
        this.scrollbarTrack = this.carouselWrapper.querySelector('.carouselScrollbar');
        this.scrollbarThumb = this.carouselWrapper.querySelector('.carouselScrollbarThumb');
        this.items = items;
        this.isDragging = false;
        this.dragStartX = 0;
        this.thumbStartLeftPx = 0;
        this.pointerId = null;
        this.animationFrame = null;
        this.init();
    }

    init() {
        this.renderItems();
        this.attachEventListeners();
        this.updateScrollbar();
    }

    renderItems() {
        this.track.innerHTML = '';
        this.items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'carouselItem';
            div.innerHTML = `
                <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                    <div class="carouselItemThumbnail" style="background-image: url('${item.thumbnail}');" role="img" aria-label="${item.alt}"></div>
                    <div class="carouselItemTitle">${item.title}</div>
                    <div class="carouselItemAlt">${item.alt}</div>
                </a>
            `;
            this.track.appendChild(div);
        });
    }

    attachEventListeners() {
        this.container.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        this.container.addEventListener('scroll', () => this.updateScrollbar());
        this.container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.scrollbarTrack.addEventListener('pointerdown', (e) => this.handleScrollbarPointerDown(e));
        window.addEventListener('pointermove', (e) => this.handleScrollbarPointerMove(e));
        window.addEventListener('pointerup', () => this.handleScrollbarPointerUp());
        window.addEventListener('resize', () => this.updateScrollbar());
    }

    handleWheel(e) {
        if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
            e.preventDefault();
            this.container.scrollBy({ left: e.deltaY, behavior: 'smooth' });
        }
    }

    handleTouchMove(e) {
        // iOSでのスクロール範囲を制限
        const maxScroll = this.container.scrollWidth - this.container.clientWidth;
        if (this.container.scrollLeft <= 0 && e.touches[0].clientX < this.container.getBoundingClientRect().width) {
            // 左端での右スワイプを防止
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                if (touch.clientX > 0) {
                    e.preventDefault();
                }
            }
        } else if (this.container.scrollLeft >= maxScroll) {
            // 右端での左スワイプを防止
            if (e.touches.length === 1) {
                e.preventDefault();
            }
        }
    }

    handleScrollbarClick(e) {
        const rect = this.scrollbarTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickRatio = Math.min(1, Math.max(0, clickX / rect.width));
        const maxScroll = this.container.scrollWidth - this.container.clientWidth;

        this.container.scrollTo({ left: maxScroll * clickRatio, behavior: 'smooth' });
    }

    handleScrollbarPointerDown(e) {
        e.preventDefault();
        if (e.target === this.scrollbarThumb) {
            this.isDragging = true;
            this.dragStartX = e.clientX;
            const trackRect = this.scrollbarTrack.getBoundingClientRect();
            const thumbRect = this.scrollbarThumb.getBoundingClientRect();
            this.thumbStartLeftPx = thumbRect.left - trackRect.left;
            this.pointerId = e.pointerId;
            this.scrollbarThumb.setPointerCapture(e.pointerId);
        } else {
            this.handleScrollbarClick(e);
        }
    }

    handleScrollbarPointerMove(e) {
        if (!this.isDragging) {
            return;
        }

        const rect = this.scrollbarTrack.getBoundingClientRect();
        const thumbRect = this.scrollbarThumb.getBoundingClientRect();
        const clickDelta = e.clientX - this.dragStartX;
        const thumbWidth = thumbRect.width;
        const trackWidth = rect.width;
        const maxThumbLeft = trackWidth - thumbWidth;
        const newLeftPx = Math.min(maxThumbLeft, Math.max(0, this.thumbStartLeftPx + clickDelta));
        const scrollRatio = maxThumbLeft > 0 ? newLeftPx / maxThumbLeft : 0;
        const maxScroll = this.container.scrollWidth - this.container.clientWidth;

        this.container.scrollLeft = maxScroll * scrollRatio;
        this.updateScrollbar();
    }

    handleScrollbarPointerUp() {
        this.isDragging = false;
        if (this.scrollbarThumb && this.pointerId !== null) {
            this.scrollbarThumb.releasePointerCapture && this.scrollbarThumb.releasePointerCapture(this.pointerId);
            this.pointerId = null;
        }
    }

    animateScroll(targetScroll) {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        const startScroll = this.container.scrollLeft;
        const delta = targetScroll - startScroll;
        if (Math.abs(delta) < 1) {
            this.container.scrollLeft = targetScroll;
            return;
        }

        const duration = 180;
        let startTime = null;

        const step = (timestamp) => {
            if (!startTime) {
                startTime = timestamp;
            }
            const progress = Math.min(1, (timestamp - startTime) / duration);
            this.container.scrollLeft = startScroll + delta * progress;
            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(step);
            }
        };

        this.animationFrame = requestAnimationFrame(step);
    }

    updateScrollbar() {
        const scrollWidth = this.container.scrollWidth - this.container.clientWidth;
        const trackRect = this.scrollbarTrack.getBoundingClientRect();
        const trackWidth = trackRect.width;

        if (scrollWidth <= 0 || !this.scrollbarThumb) {
            this.scrollbarThumb.style.width = '100%';
            this.scrollbarThumb.style.left = '0px';
            return;
        }

        const thumbRatio = this.container.clientWidth / this.container.scrollWidth;
        const thumbWidthPx = Math.max(0.12 * trackWidth, thumbRatio * trackWidth);
        const maxThumbLeftPx = trackWidth - thumbWidthPx;
        const thumbPositionPx = maxThumbLeftPx > 0 ? (this.container.scrollLeft / scrollWidth) * maxThumbLeftPx : 0;

        this.scrollbarThumb.style.width = `${thumbWidthPx}px`;
        this.scrollbarThumb.style.left = `${thumbPositionPx}px`;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Works用のデータ
    const worksData = [
        {
            title: "SITRUS Coordinator",
            thumbnail: "image/works/sitrus-coordinator.png",
            link: "https://github.com/kazu-iroiro/sit-sitrus-coordinator",
            alt: "履修登録ポータルサイトのUIをリッチにするChrome拡張機能"
        },
        {
            title: "ポートフォリオ",
            thumbnail: "image/github-mark/github-mark.png",
            link: "https://github.com/kazu-iroiro/portfolio",
            alt: "このサイトのリポジトリ"
        },
        {
            title: "QuRoko",
            thumbnail: "image/github-mark/github-mark.png",
            link: "https://github.com/kazu-iroiro/QuRoko",
            alt: "QRコードを使った手紙共有サービス"
        }
    ];

    // Articles用のデータ
    const articlesData = [
        {
            title: "Windows10/11のタブレットUIを回避する",
            thumbnail: "image/qiita-icon-png/qiita-icon.png",
            link: "https://qiita.com/kazu_iroiro/items/15e6ee3a6f1d1b66e48a",
            alt: "Windows10/11のタブレットUIを回避するための備忘録"
        },
        {
            title: "新しいSkyWayを使って文化祭やイベントで使えそうなWebトランシーバーを作ってみた",
            thumbnail: "image/qiita-icon-png/qiita-icon.png",
            link: "https://qiita.com/kazu_iroiro/items/089f596cfb9bfd3773f2",
            alt: "SkyWayでトランシーバを作った話"
        }
    ];

    new Carousel('worksCarousel', 'worksTrack', worksData);
    new Carousel('articlesCarousel', 'articlesTrack', articlesData);

    function checkOverflow() {
        const header = document.getElementById("header");
        const leftcontent = document.getElementById("leftBox");
        const rightcontent = document.getElementById("rightBox");

        if (!header) return;
        if (!leftcontent) return;
        if (header.offsetHeight + leftcontent.offsetHeight > window.innerHeight && window.innerWidth < 768) {
            leftcontent.classList.add("overflowLeftBox");
            rightcontent.classList.add("overflowRightBox");
            rightcontent.classList.remove("rightBox");
            leftcontent.style.position = "fixed";
        } else if (header.offsetHeight + leftcontent.offsetHeight > window.innerHeight && window.innerWidth >= 768) {
            leftcontent.style.position = "absolute";
        } else {
            leftcontent.classList.remove("overflowLeftBox");
            rightcontent.classList.remove("overflowRightBox");
            rightcontent.classList.add("rightBox");
            leftcontent.style.position = window.innerWidth >= 768 ? "fixed" : "absolute";
        }
    }

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
});
