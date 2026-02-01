import { ReactNode } from "react";
import { OnProgressParameters, TypedArray } from "pdfjs-dist/types/src/display/api";
import { DocumentInitParameters } from "pdfjs-dist/types/src/display/api";
import { PdfLoader, PdfLoaderProps } from "./PdfLoader";
import { SimplePdfViewer, SimplePdfViewerProps } from "./SimplePdfViewer";

export type PdfViewerProps = Omit<PdfLoaderProps, "children"> &
  Omit<SimplePdfViewerProps, "pdfDocument">;

export const PdfViewer = ({
  document,
  beforeLoad,
  errorMessage,
  onError,
  workerSrc,
  ...viewerProps
}: PdfViewerProps) => {
  return (
    <PdfLoader
      document={document}
      beforeLoad={beforeLoad}
      errorMessage={errorMessage}
      onError={onError}
      workerSrc={workerSrc}
    >
      {(pdfDocument) => <SimplePdfViewer pdfDocument={pdfDocument} {...viewerProps} />}
    </PdfLoader>
  );
};
