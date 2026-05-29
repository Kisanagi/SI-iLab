export default function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 pb-8 animate-fade-in-up">
      <div className="relative mb-4 sm:mb-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden">
          <img
            src="/gunadarma.png"
            alt="Universitas Gunadarma"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" /></svg>';
            }}
          />
        </div>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full" />
        <span className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-400 rounded-full" />
      </div>
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
        Selamat datang di iLab
      </h2>
      <p className="text-xs sm:text-sm text-gray-500 max-w-xs">
        Ceritakan kendala praktikum Anda, atau ketik pertanyaan untuk memulai.
      </p>
    </div>
  );
}
