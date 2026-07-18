export default function ChatInput({
  input,
  handleInputChange,
  handleKeyDown,
  sendMessage,
  loading,
  loadingHistory,
  showNpmPopup,
  attachedFile,
  fileInputRef,
  textareaRef,
  handleFileSelect,
  removeAttachedFile,
}) {
  return (
    <>
      {/* Preview file terlampir */}
      {attachedFile && (
        <div className="shrink-0 bg-white border-t border-gray-100 px-4 pt-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 w-fit max-w-full">
              {attachedFile.preview ? (
                <img
                  src={attachedFile.preview}
                  alt="preview"
                  className="h-10 w-10 object-cover rounded-lg shrink-0"
                />
              ) : (
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-red-500">PDF</span>
                </div>
              )}
              <span className="text-xs text-gray-700 truncate max-w-[180px]">
                {attachedFile.name}
              </span>
              <button
                onClick={removeAttachedFile}
                className="text-gray-400 hover:text-gray-600 shrink-0 ml-1 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-3 sm:px-4 pt-2.5 sm:pt-3 pb-2 sm:pb-1">
        <form onSubmit={sendMessage}>
          <div className="flex gap-2 max-w-3xl mx-auto items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || loadingHistory || showNpmPopup}
              title="Lampirkan gambar atau PDF"
              className="shrink-0 mb-1.5 text-gray-400 hover:text-primary disabled:opacity-40 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan..."
              disabled={loading || loadingHistory || showNpmPopup}
              rows={1}
              className="flex-1 border border-gray-300 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light disabled:opacity-60 resize-none overflow-y-auto"
              style={{ minHeight: "38px" }}
            />

            <button
              type="submit"
              disabled={(!input.trim() && !attachedFile) || loading || loadingHistory || showNpmPopup}
              title="Kirim"
              className="shrink-0 mb-0.5 w-9 h-9 bg-primary hover:bg-primary-dark disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
