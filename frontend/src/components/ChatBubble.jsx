function renderWithLinks(text, isUser) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (/^(https?:\/\/[^\s]+|www\.[^\s]+)$/.test(part)) {
      const cleanPart = part.replace(/[.,!?;:)\]>'"]+$/, '');
      const trailingPunct = part.slice(cleanPart.length);
      const href = cleanPart.startsWith('http') ? cleanPart : `https://${cleanPart}`;
      return (
        <span key={i}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline ${isUser ? 'text-blue-200 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
          >
            {cleanPart}
          </a>
          {trailingPunct}
        </span>
      );
    }
    return part;
  });
}

export default function ChatBubble({ role, content, imagePreview, fileName }) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-fade-in-up`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl text-sm leading-relaxed break-words overflow-hidden ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-200 text-gray-800 rounded-bl-sm'
        }`}
      >
        {/* Tampilkan gambar jika ada */}
        {imagePreview && (
          <img
            src={imagePreview}
            alt="lampiran"
            className="w-full object-cover rounded-t-2xl"
          />
        )}

        {/* Tampilkan card PDF jika ada */}
        {fileName && !imagePreview && (
          <div className={`flex items-center gap-3 px-4 py-3 ${isUser ? 'bg-blue-500' : 'bg-gray-300'} rounded-t-2xl`}>
            {/* Ikon PDF */}
            <div className="shrink-0 w-10 h-12 bg-white rounded-lg flex flex-col items-center justify-center shadow-sm">
              <div className="w-full h-1.5 bg-red-500 rounded-t-lg" />
              <span className="text-red-500 text-xs font-bold mt-1">PDF</span>
              <div className="flex flex-col gap-0.5 mt-1 px-1.5 w-full">
                <div className="h-0.5 bg-gray-200 rounded" />
                <div className="h-0.5 bg-gray-200 rounded" />
                <div className="h-0.5 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
            {/* Nama file */}
            <div className="min-w-0">
              <p className={`text-xs font-semibold truncate max-w-[160px] ${isUser ? 'text-white' : 'text-gray-800'}`}>
                {fileName}
              </p>
              <p className={`text-xs mt-0.5 ${isUser ? 'text-blue-200' : 'text-gray-500'}`}>
                Dokumen PDF
              </p>
            </div>
          </div>
        )}

        {/* Teks pesan */}
        {content && (
          <p className="px-4 py-2.5 whitespace-pre-wrap">
            {renderWithLinks(content, isUser)}
          </p>
        )}
      </div>
    </div>
  );
}
