import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          className="fixed bottom-20 left-1/2 z-50 px-6 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-xl border border-slate-700 flex items-center gap-4 min-w-[300px]"
        >
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-1">
              {offlineReady ? 'App ready to work offline' : 'New content available'}
            </h3>
            <p className="text-xs text-slate-400">
              {offlineReady
                ? 'You can use this app without internet access.'
                : 'Click reload to update to the latest version.'}
            </p>
          </div>
          
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Reload
            </button>
          )}
          
          <button
            onClick={close}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
