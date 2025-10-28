export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-5">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 text-black">Barcode Scanner</h1>
          <p className="text-lg text-gray-600">Cloud-Based System</p>
        </div>

        <div className="bg-white border-4 border-black p-8 space-y-4">
          <a
            href="/scanner"
            className="block w-full bg-black hover:bg-gray-800 text-white text-center font-semibold py-4 px-6 border-2 border-black transition-all"
          >
            Start Scanning
          </a>

          <a
            href="/dashboard"
            className="block w-full bg-white hover:bg-gray-100 text-black text-center font-semibold py-4 px-6 border-2 border-black transition-all"
          >
            Dashboard
          </a>

          <a
            href="/import"
            className="block w-full bg-white hover:bg-gray-100 text-black text-center font-semibold py-4 px-6 border-2 border-black transition-all"
          >
            Import Products
          </a>

          <div className="text-center text-sm text-gray-600 mt-6 pt-6 border-t-2 border-black">
            <p>Scan barcodes with your smartphone</p>
            <p>Automatically saved to cloud</p>
          </div>
        </div>
      </div>
    </div>
  );
}
