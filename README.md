# React Minimal PDF Viewer

A lightweight, standalone PDF viewer for React, built on top of [pdf.js](https://mozilla.github.io/pdf.js/). It focuses on simple rendering without the overhead of annotations, text editing, or heavy UI components.

## Features

- **Minimalist**: Just renders the PDF.
- **Customizable**: Control scale, borders, text layer, and styles.
- **Virtualization-friendly**: Efficiently handles page rendering (basic).
- **React 19 Ready**: Built with the latest React standards.

## Installation

```bash
npm install react-minimal-pdf-viewer pdfjs-dist
# or
yarn add react-minimal-pdf-viewer pdfjs-dist
```

> Note: You need to install `pdfjs-dist` as a peer dependency.

## Usage

### Basic Example

Use the unified `PdfViewer` component for the simplest implementation.

```tsx
import { PdfViewer } from "react-minimal-pdf-viewer";

const App = () => {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <PdfViewer 
        document="/path/to/my-document.pdf"
        pdfScaleValue="page-fit"
      />
    </div>
  );
};
export default App;
```

### Loading from a Remote URL

```tsx
<PdfViewer document="https://example.com/api/documents/123/content" />
```

### Advanced / Composed Usage

If you need fine-grained control over the loading state or want to build a custom UI around the loaded logic, you can use the composed components `PdfLoader` and `SimplePdfViewer` separately.

```tsx
import { PdfLoader, SimplePdfViewer } from "react-minimal-pdf-viewer";

<PdfLoader document="/doc.pdf">
  {(pdfDocument) => (
    <SimplePdfViewer pdfDocument={pdfDocument} />
  )}
</PdfLoader>
```

### Configuration Props

The `PdfViewer` accepts all props from `SimplePdfViewer` plus the loading props.

```tsx
<PdfViewer
  document={document}
  // Loader props
  beforeLoad={<MySpinner />}
  errorMessage={(err) => <div>Error: {err.message}</div>}
  // Viewer props
  pdfScaleValue={1.5}
  textLayerMode={2}
  removePageBorders={true}
/>
```

You can customize the viewer behavior with additional props.

```tsx
<SimplePdfViewer
  pdfDocument={pdfDocument}
  pdfScaleValue={1.2}          // Zoom level
  textLayerMode={1}            // 0=off, 1=on, 2=enhanced
  removePageBorders={false}    // Show borders
  externalLinkTarget={2}       // Open links in new tab
  className="my-viewer-class"  // Custom CSS class
  style={{ background: '#f0f0f0' }} // Custom inline styles
  onPageChange={(page) => console.log(`Current page: ${page}`)}
/>
```

### Components

#### `PdfLoader`

Handles the asynchronous loading of the PDF document.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `document` | `string \| URL \| TypedArray...` | **Required** | The source of the PDF. Can be a URL, base64, or buffer. |
| `workerSrc` | `string` | CDN URL | Path to the pdf.worker.js. Defaults to unpkg. |
| `beforeLoad` | `(progress) => ReactNode` | default spinner | Component to show while loading (`progress` object provided). |
| `errorMessage` | `(error) => ReactNode` | default text | Component to render on error. |
| `onError` | `(error) => void` | throws error | Callback when an error occurs. |

#### `SimplePdfViewer`

Renders the loaded PDF document.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pdfDocument` | `PDFDocumentProxy` | **Required** | The loaded PDF document object. |
| `pdfScaleValue` | `number \| string` | `0.9` | Scale of the PDF. Can be "page-width", "page-fit", "auto", or a number. |
| `textLayerMode` | `number` | `2` | Text selection mode. 0 = Disabled, 1 = Enabled, 2 = Improved. |
| `removePageBorders` | `boolean` | `true` | Whether to remove the CSS borders around pages. |
| `externalLinkTarget`| `number` | `2` | 0 = Main window, 1 = None, 2 = New tab, 3 = Parent, 4 = Top. |
| `onPageChange` | `(page: number) => void` | - | Callback fired when the current visible page changes. |
| `currentPage` | `number` | `1` | Providing this helps initially scroll to a page (though mostly handled internally currently). |
| `style` | `CSSProperties` | - | Inline styles for the viewer container. |
| `className` | `string` | - | CSS class for the viewer container. |

## Styling

You can style the viewer by passing a `className` or `style` prop. The component uses standard PDF.js class names, so you can target internal elements easily.

```css
/* Example CSS */
.my-viewer-class {
  background-color: #333; /* Dark background */
}

/* Target internal pages */
.my-viewer-class .page {
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
}
```

```tsx
<PdfViewer 
  document={doc} 
  className="my-viewer-class" 
/>
```

## License

ISC
