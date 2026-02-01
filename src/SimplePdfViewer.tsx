import debounce from "lodash.debounce";
import { PDFDocumentProxy } from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import type { EventBus as TEventBus, PDFLinkService as TPDFLinkService, PDFViewer as TPDFViewer } from "pdfjs-dist/web/pdf_viewer.mjs";
import { CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./style/pdf_viewer.css";

let EventBus: typeof TEventBus, PDFLinkService: typeof TPDFLinkService, PDFViewer: typeof TPDFViewer;

(async () => {
  const pdfjs = await import("pdfjs-dist/web/pdf_viewer.mjs");
  EventBus = pdfjs.EventBus;
  PDFLinkService = pdfjs.PDFLinkService;
  PDFViewer = pdfjs.PDFViewer;
})();

const DEFAULT_SCALE_VALUE = 0.9;

export interface SimplePdfViewerProps {
  pdfDocument: PDFDocumentProxy;
  pdfScaleValue?: number | string;
  style?: CSSProperties;
  className?: string;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  textLayerMode?: number;
  removePageBorders?: boolean;
  externalLinkTarget?: number;
}

export const SimplePdfViewer = ({
  pdfDocument,
  pdfScaleValue = DEFAULT_SCALE_VALUE,
  style,
  className,
  onPageChange,
  currentPage = 1,
  textLayerMode = 2,
  removePageBorders = true,
  externalLinkTarget = 2,
}: SimplePdfViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<InstanceType<typeof TPDFViewer> | null>(null);
  const isDocumentInitializedRef = useRef(false);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const eventBusRef = useRef<InstanceType<typeof TEventBus>>(new EventBus());
  const linkServiceRef = useRef<InstanceType<typeof TPDFLinkService>>(
    new PDFLinkService({
      eventBus: eventBusRef.current,
      externalLinkTarget,
    })
  );
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Initialize PDF viewer
  useLayoutEffect(() => {
    if (!containerRef.current || isDocumentInitializedRef.current) return;

    const debouncedInit = debounce(async () => {
      viewerRef.current =
        viewerRef.current ||
        new PDFViewer({
          container: containerRef.current!,
          eventBus: eventBusRef.current,
          textLayerMode: textLayerMode as 0 | 1 | 2,
          removePageBorders,
          linkService: linkServiceRef.current,
        });
      viewerRef.current.setDocument(pdfDocument);
      linkServiceRef.current.setDocument(pdfDocument);
      linkServiceRef.current.setViewer(viewerRef.current);
      setIsViewerReady(true);
      isDocumentInitializedRef.current = true;
    }, 100);

    debouncedInit();

    return () => {
      debouncedInit.cancel();
    };
  }, [pdfDocument, textLayerMode, removePageBorders]);

  // Handle scale
  const handleScaleValue = useCallback(() => {
    if (viewerRef.current && viewerRef.current.viewer) {
      try {
        viewerRef.current.currentScaleValue = pdfScaleValue.toString();
      } catch (error: any) {
        if (!error.message?.includes('offsetParent')) {
          console.error('Error setting scale:', error);
        }
      }
    }
  }, [pdfScaleValue]);

  // Set up resize observer and scale handling
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    resizeObserverRef.current = new ResizeObserver(handleScaleValue);
    resizeObserverRef.current.observe(containerRef.current);

    eventBusRef.current.on("pagesinit", handleScaleValue);

    return () => {
      eventBusRef.current.off("pagesinit", handleScaleValue);
      resizeObserverRef.current?.disconnect();
    };
  }, [pdfScaleValue, handleScaleValue]);

  // Track current page on scroll
  const handleScroll = useCallback(() => {
    const content = containerRef.current;
    if (!content) return;

    const pages = content.querySelectorAll(".page");
    if (!pages.length) return;

    const contentRect = content.getBoundingClientRect();
    const contentCenterY = contentRect.top + contentRect.height / 2;

    let nearestPage = -1;
    let nearestDist = Number.MAX_VALUE;

    pages.forEach((el, index) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const pageCenterY = rect.top + rect.height / 2;
      const dist = Math.abs(pageCenterY - contentCenterY);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearestPage = index + 1;
      }
    });

    if (nearestPage !== -1 && nearestPage !== currentPage && onPageChange) {
      onPageChange(nearestPage);
    }
  }, [currentPage, onPageChange]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        overflow: "auto",
        position: "absolute",
        inset: 0,
        ...style,
      }}
    >
      <div className="pdfViewer" ref={pageContainerRef}></div>
      {isViewerReady && <RemoveDuplicatePages />}
      {isViewerReady && <WrapPagesWithContainer />}
      <style>
        {`
          .page-wrapper {
            position: relative !important;
            margin: 10px auto !important;
            display: block !important;
          }
          .page-wrapper .page {
            position: relative !important;
            display: block !important;
            margin: 0 !important;
          }
        `}
      </style>
    </div>
  );
};

const RemoveDuplicatePages = () => {
  useEffect(() => {
    const removeDuplicates = () => {
      const seenPages = new Map();
      document.querySelectorAll(".page").forEach((page) => {
        const pageNumber = page.getAttribute("data-page-number");
        if (!pageNumber) return;
        if (seenPages.has(pageNumber)) {
          page.remove();
        } else {
          seenPages.set(pageNumber, page);
        }
      });
    };

    removeDuplicates();

    const observer = new MutationObserver(removeDuplicates);
    const pageContainer = document.querySelector(".pdfViewer");
    if (pageContainer) {
      observer.observe(pageContainer, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []);

  return null;
};

const WrapPagesWithContainer = () => {
  useEffect(() => {
    const wrapPages = () => {
      const pageContainer = document.querySelector(".pdfViewer");
      if (!pageContainer) return;

      const pages = pageContainer.querySelectorAll(".page");

      pages.forEach((page) => {
        const htmlPage = page as HTMLElement;

        if (page.parentElement?.classList.contains("page-wrapper")) {
          const wrapper = page.parentElement as HTMLElement;
          const pageWidth = htmlPage.offsetWidth;
          if (pageWidth > 0) {
            wrapper.style.width = `${pageWidth}px`;
          }
          return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "page-wrapper";
        wrapper.setAttribute("data-page-number", page.getAttribute("data-page-number") || "");

        const pageWidth = htmlPage.offsetWidth;
        if (pageWidth > 0) {
          wrapper.style.width = `${pageWidth}px`;
        }

        if (page.parentNode) {
          page.parentNode.insertBefore(wrapper, page);
          wrapper.appendChild(page);
        }
      });
    };

    const timeoutId = setTimeout(wrapPages, 300);

    const observer = new MutationObserver(() => {
      setTimeout(wrapPages, 100);
    });

    const pageContainer = document.querySelector(".pdfViewer");
    if (pageContainer) {
      observer.observe(pageContainer, {
        childList: true,
        attributes: true,
        subtree: true,
        attributeFilter: ["style"],
      });
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return null;
};
