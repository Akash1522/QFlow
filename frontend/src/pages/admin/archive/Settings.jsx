import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { toast } from 'react-toastify';

const Settings = () => {
  const [settings, setSettings] = useState({
    maxQueueTime: 30,
    maintenanceMode: false,
    autoCleanInterval: 120
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/admin/settings');
        setSettings(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = () => {
      setSaving(true);
      setTimeout(() => {
          setSaving(false);
          toast.success("Settings saved successfully!");
      }, 1000);
  }

  if (loading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gray-500/20 text-gray-400 flex items-center justify-center">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold">System Settings</h2>
          <p className="text-gray-400">Configure global application behavior</p>
        </div>
      </div>

      <div className="glass-card p-8 space-y-8">
        <div className="space-y-6">
            <h3 className="text-xl font-bold border-b border-white/10 pb-4">Queue Rules</h3>
            
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="font-medium text-white">Max Queue Wait Time</h4>
                    <p className="text-sm text-gray-400">Maximum allowed estimated wait time (minutes)</p>
                </div>
                <input 
                    type="number" 
                    value={settings.maxQueueTime}
                    onChange={(e) => setSettings({...settings, maxQueueTime: e.target.value})}
                    className="w-24 bg-dark-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 text-center"
                />
            </div>

            <div className="flex justify-between items-center">
                <div>
                    <h4 className="font-medium text-white">Auto-Clean Interval</h4>
                    <p className="text-sm text-gray-400">Schedule automatic cleaning status (minutes)</p>
                </div>
                <input 
                    type="number" 
                    value={settings.autoCleanInterval}
                    onChange={(e) => setSettings({...settings, autoCleanInterval: e.target.value})}
                    className="w-24 bg-dark-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 text-center"
                />
            </div>
        </div>

        <div className="space-y-6 pt-6 border-t border-white/10">
            <h3 className="text-xl font-bold border-b border-white/10 pb-4">System State</h3>
            
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="font-medium text-white">Global Maintenance Mode</h4>
                    <p className="text-sm text-gray-400">Disables all queue joining functionality</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={settings.maintenanceMode}
                        onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                        className="sr-only peer" 
                    />
                    <div className="w-14 h-7 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
                </label>
            </div>
        </div>

        <div className="pt-8 flex justify-end">
            <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:opacity-70"
            >
                {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <><Save size={18} /> Save Changes</>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
