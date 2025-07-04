const GTXLoadingAnimation = () => {
    return (
      <div className="w-full h-[300px] bg-white dark:bg-[#151924] rounded-b-lg text-gray-900 dark:text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-pulse"></div>
        
        <div className="absolute w-32 h-32 border-2 border-transparent border-t-blue-400 border-r-cyan-400 rounded-full animate-spin opacity-30"></div>
        <div className="absolute w-28 h-28 border border-transparent border-b-blue-300 border-l-cyan-300 rounded-full animate-spin opacity-20" style={{animationDirection: 'reverse', animationDuration: '3s'}}></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full blur-lg opacity-30 animate-pulse scale-110"></div>
            
            <img 
              src="/logo/gtx.png" 
              className="h-24 w-24" 
              alt="GTX Logo"
            />
            <div className="relative animate-bounce">
            </div>
          </div>
        </div>
        
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-60"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-40" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-50" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-cyan-300 rounded-full animate-ping opacity-30" style={{animationDelay: '0.5s'}}></div>
        
        <style jsx>{`
          @keyframes logoFloat {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-10px) scale(1.05); }
          }
          
          @keyframes progressBar {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
          
          .animate-spin {
            animation: spin 2s linear infinite;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
};

export default GTXLoadingAnimation;