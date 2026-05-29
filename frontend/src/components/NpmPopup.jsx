export default function NpmPopup({ npmInput, setNpmInput, popupClosing, handleNpmSubmit }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 animate-fade-in">
      <div className={`bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm ${popupClosing ? "animate-fade-out-scale" : "animate-fade-in-scale"}`}>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Selamat datang!</h2>
        <p className="text-sm text-gray-500 mb-4">
          Masukkan NPM kamu untuk menyimpan riwayat chat.
        </p>
        <form onSubmit={handleNpmSubmit} className="space-y-3">
          <input
            type="text"
            value={npmInput}
            onChange={(e) => setNpmInput(e.target.value)}
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
          />
          <button
            type="submit"
            disabled={!npmInput.trim()}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            Mulai Chat
          </button>
        </form>
      </div>
    </div>
  );
}
