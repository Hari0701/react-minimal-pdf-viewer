import { GlobalWorkerOptions, OnProgressParameters, getDocument, type PDFDocumentLoadingTask, type PDFDocumentProxy } from "pdfjs-dist";
import pdfjsPackage from "pdfjs-dist/package.json";
import { DocumentInitParameters, TypedArray } from "pdfjs-dist/types/src/display/api";
import { ReactNode, useEffect, useRef, useState } from "react";

const pdfjsVersion = pdfjsPackage.version;
const DEFAULT_BEFORE_LOAD = (progress: OnProgressParameters) => (
  <div style={{ color: "black" }}>Loading {Math.floor((progress.loaded / progress.total) * 100)}%</div>
);

const DEFAULT_ERROR_MESSAGE = (error: Error) => <div style={{ color: "black" }}>{error.message}</div>;

const DEFAULT_ON_ERROR = (error: Error) => {
  throw new Error(`Error loading PDF document: ${error.message}!`);
};
const DEFAULT_WORKER_SRC = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

export interface PdfLoaderProps {
  document: string | URL | TypedArray | ArrayBuffer | DocumentInitParameters;
  beforeLoad?(progress: OnProgressParameters): ReactNode;
  errorMessage?(error: Error): ReactNode;
  children(pdfDocument: PDFDocumentProxy): ReactNode;
  onError?(error: Error): void;
  workerSrc?: string;
}

export const PdfLoader = ({
  document,
  beforeLoad = DEFAULT_BEFORE_LOAD,
  errorMessage = DEFAULT_ERROR_MESSAGE,
  children,
  onError = DEFAULT_ON_ERROR,
  workerSrc = DEFAULT_WORKER_SRC,
}: PdfLoaderProps) => {
  const pdfLoadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const pdfDocumentRef = useRef<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<OnProgressParameters | null>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;

    GlobalWorkerOptions.workerSrc = workerSrc;
    pdfLoadingTaskRef.current = getDocument(document);
    pdfLoadingTaskRef.current.onProgress = (progress: OnProgressParameters) => {
      setLoadingProgress(progress.loaded > progress.total ? null : progress);
    };

    pdfLoadingTaskRef.current.promise
      .then((pdfDocument: PDFDocumentProxy) => {
        pdfDocumentRef.current = pdfDocument;
        hasLoaded.current = true;
      })
      .catch((error: Error) => {
        if (error.message !== "Worker was destroyed") {
          setError(error);
          onError(error);
        }
      })
      .finally(() => {
        setLoadingProgress(null);
      });

    return () => {
      if (pdfLoadingTaskRef.current) {
        pdfLoadingTaskRef.current.destroy();
      }
      if (pdfDocumentRef.current) {
        pdfDocumentRef.current.destroy();
      }
    };
  }, [document]);

  return error
    ? errorMessage(error)
    : loadingProgress
    ? beforeLoad(loadingProgress)
    : pdfDocumentRef.current && children(pdfDocumentRef.current);
};
