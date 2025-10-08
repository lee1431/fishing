(async function () {
  const { useEffect, useMemo, useState } = React;

  // ✅ 외부 JSON 로드
  async function useContent() {
    const [data, setData] = useState([]);
    useEffect(() => {
      fetch("./contents.json")
        .then((res) => res.json())
        .then(setData)
        .catch((err) => console.error("콘텐츠 로드 실패:", err));
    }, []);
    return data;
  }

  function useSpreads(pages) {
    return useMemo(() => {
      const spreads = [];
      let i = 0;
      while (i < pages.length) {
        const p = pages[i];
        if (p.type === "spreadImage") {
          spreads.push({ left: i, right: undefined, spreadOf: i });
          i += 1;
        } else {
          const left = i;
          const right =
            i + 1 < pages.length && pages[i + 1].type !== "spreadImage"
              ? i + 1
              : undefined;
          spreads.push({ left, right });
          i += right ? 2 : 1;
        }
      }
      return spreads;
    }, [pages]);
  }

  function Page({ page }) {
    if (!page) return React.createElement("div", { className: "bg-white/70" });

    if (page.type === "empty") {
      return React.createElement("div", {
        className:
          "relative h-full bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 m-6",
      });
    }

    if (page.type === "text") {
      const alignClass =
        page.align === "center"
          ? " text-center mx-auto"
          : page.align === "right"
          ? " text-right ml-auto"
          : " text-left";
      return React.createElement(
        "div",
        { className: "h-full bg-white dark:bg-neutral-950 flex" },
        React.createElement(
          "div",
          { className: "m-8 xl:m-12 2xl:m-16 w-full flex flex-col" },
          page.title &&
            React.createElement(
              "h2",
              {
                className:
                  "text-xl md:text-2xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4",
              },
              page.title
            ),
          React.createElement(
            "p",
            {
              className:
                "text-[15px] md:text-base leading-7 md:leading-8 text-neutral-700 dark:text-neutral-200 whitespace-pre-wrap" +
                alignClass,
            },
            page.body
          )
        )
      );
    }

    if (page.type === "image" || page.type === "spreadImage") {
      return React.createElement(
        "figure",
        {
          className:
            "relative h-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden",
        },
        React.createElement("img", {
          src: page.src,
          alt: page.alt || "image",
          className:
            "h-full w-full object-" +
            (page.imageFit === "contain" ? "contain" : "cover") +
            " select-none",
        }),
        page.caption &&
          React.createElement(
            "figcaption",
            {
              className:
                "absolute bottom-0 left-0 right-0 text-xs md:text-sm text-white/90 bg-gradient-to-t from-black/60 to-transparent p-3",
            },
            page.caption
          )
      );
    }
  }

  function ThoughtMechanicsBook() {
    const CONTENT = useContent();
    const spreads = useSpreads(CONTENT);
    const [index, setIndex] = useState(0);
    const max = spreads.length - 1;

    const goPrev = () => setIndex((i) => Math.max(0, i - 1));
    const goNext = () => setIndex((i) => Math.min(max, i + 1));

    useEffect(() => {
      const onKey = (e) => {
        if (e.key === "ArrowLeft") goPrev();
        if (e.key === "ArrowRight") goNext();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [max]);

    const progress = spreads.length
      ? Math.round(((index + 1) / (max + 1)) * 100)
      : 0;

    const current = spreads[index] || {};
    const leftPage =
      current.left !== undefined ? CONTENT[current.left] : undefined;
    const rightPage =
      current.right !== undefined ? CONTENT[current.right] : undefined;
    const isSpread = leftPage && leftPage.type === "spreadImage";

    if (!CONTENT.length)
      return React.createElement(
        "div",
        { className: "p-10 text-center text-neutral-500" },
        "콘텐츠를 불러오는 중..."
      );

    return React.createElement(
      "div",
      {
        className:
          "min-h-[100svh] bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50",
      },
      React.createElement(
        "main",
        { className: "max-w-[1100px] mx-auto p-4 md:p-6" },
        React.createElement(
          "div",
          {
            className:
              "relative aspect-[16/9] w-full rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-neutral-900",
          },
          React.createElement("button", {
            onClick: goPrev,
            className:
              "absolute inset-y-0 left-0 w-[20%] hover:bg-black/0 active:bg-black/10",
          }),
          React.createElement("button", {
            onClick: goNext,
            className:
              "absolute inset-y-0 right-0 w-[20%] hover:bg-black/0 active:bg-black/10",
          }),
          React.createElement(
            "div",
            { className: "h-full w-full grid grid-cols-1 lg:grid-cols-2" },
            isSpread
              ? React.createElement(
                  "div",
                  { className: "col-span-2" },
                  React.createElement(Page, { page: leftPage })
                )
              : [
                  React.createElement(
                    "div",
                    { key: "l", className: "border-r border-neutral-200 dark:border-neutral-800" },
                    React.createElement(Page, { page: leftPage })
                  ),
                  React.createElement(
                    "div",
                    { key: "r" },
                    React.createElement(Page, { page: rightPage })
                  ),
                ]
          )
        ),
        React.createElement(
          "div",
          { className: "mt-4 flex items-center justify-between" },
          React.createElement(
            "button",
            { onClick: goPrev, className: "px-3 py-2 border rounded-full" },
            "이전"
          ),
          React.createElement("div", { className: "text-sm opacity-70" }, "← / → 로 넘기기"),
          React.createElement(
            "button",
            { onClick: goNext, className: "px-3 py-2 border rounded-full" },
            "다음"
          )
        )
      )
    );
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(React.createElement(ThoughtMechanicsBook));
})();
