
import React, { useState } from 'react';
import { DifyModelConfig } from '../types';
import { XIcon, PlusIcon, TrashIcon, SaveIcon } from './Icons';

interface ModelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: DifyModelConfig[];
  onUpdateModels: (models: (DifyModelConfig | any)[]) => void;
  currentModelId: string;
  onSelectModel: (id: string) => void;
}

const ModelManagerModal: React.FC<ModelManagerModalProps> = ({
  isOpen,
  onClose,
  models,
  onUpdateModels,
  currentModelId,
  onSelectModel
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<DifyModelConfig>({
    id: '',
    name: '',
    difyApiKey: '', 
    clinkAk: '',
    clinkSk: '',
    agentId: ''
  });

  const handleCreate = () => {
    const template = models.find(m => m.id === currentModelId) || models[models.length - 1];
    
    setEditForm({
      id: Date.now().toString(),
      name: template ? `${template.name} (副本)` : '新智能体配置',
      difyApiKey: template?.difyApiKey || '', 
      clinkAk: template?.clinkAk || '',
      clinkSk: template?.clinkSk || '',
      agentId: template?.agentId || ''
    });
    setIsEditing(true);
  };

  const handleEdit = (model: DifyModelConfig) => {
    setEditForm({ ...model });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editForm.name || !editForm.clinkAk || !editForm.agentId) {
      alert("请填写完整的必要参数");
      return;
    }

    const existingIndex = models.findIndex(m => m.id === editForm.id);
    let newModels;
    if (existingIndex >= 0) {
      newModels = [...models];
      newModels[existingIndex] = editForm;
    } else {
      newModels = [...models, editForm];
    }
    
    onUpdateModels(newModels);
    setIsEditing(false);
    
    if (models.length === 0 || !currentModelId) {
        onSelectModel(editForm.id);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个智能体配置吗？')) {
      const newModels = models.filter(m => m.id !== id);
      onUpdateModels(newModels);
      if (currentModelId === id && newModels.length > 0) {
        onSelectModel(newModels[0].id);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#18181b] w-full max-w-2xl rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[85vh] overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800/50">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">管理智能体配置</h2>
            <p className="text-xs text-zinc-500 mt-1">配置接入参数，开启属于您的灵动智能空间</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            <XIcon className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-1/3 border-r border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-900/30 flex flex-col">
            <div className="p-4">
               <button onClick={handleCreate} className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-sm">
                 <PlusIcon className="w-4 h-4" />
                 <span>添加新智能体</span>
               </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
               {models.length === 0 && <div className="text-center py-12 text-xs text-zinc-400">暂无智能体配置</div>}
               {models.map(model => (
                 <div 
                    key={model.id} 
                    onClick={() => handleEdit(model)} 
                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${isEditing && editForm.id === model.id ? 'bg-white dark:bg-zinc-800 border-indigo-500/50 shadow-sm' : 'bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
                 >
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate dark:text-zinc-200">{model.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono truncate">ID: {model.agentId || '未配置'}</span>
                    </div>
                    {currentModelId === model.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50"></div>}
                 </div>
               ))}
            </div>
          </div>

          <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-[#18181b] custom-scrollbar">
             {isEditing ? (
               <div className="space-y-6 animate-in slide-in-from-right-4 duration-400">
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">显示名称</label>
                      <input className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all" placeholder="例如：Zenava 写作专家" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Access Key ID (密钥 ID)</label>
                        <input className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="AK" value={editForm.clinkAk} onChange={e => setEditForm({...editForm, clinkAk: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Access Key Secret (密钥凭证)</label>
                        <input type="password" placeholder="SK" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20" value={editForm.clinkSk} onChange={e => setEditForm({...editForm, clinkSk: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Agent ID (引擎标识)</label>
                      <input className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="唯一业务 ID" value={editForm.agentId} onChange={e => setEditForm({...editForm, agentId: e.target.value})} />
                  </div>

                  <div className="pt-8 flex items-center justify-between">
                      {models.find(m => m.id === editForm.id) && (
                          <button onClick={() => handleDelete(editForm.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                            <TrashIcon className="w-4 h-4" /> 
                            <span>移除此智能体</span>
                          </button>
                      )}
                      <div className="flex gap-3 ml-auto">
                        <button onClick={() => setIsEditing(false)} className="px-5 py-2 text-zinc-500 text-sm font-medium">取消</button>
                        <button onClick={handleSave} className="px-8 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-zinc-500/10 active:scale-95 transition-all">
                          <SaveIcon className="w-4 h-4" /> 
                          <span>保存并生效</span>
                        </button>
                      </div>
                  </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
                  <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center opacity-50">
                    <PlusIcon className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium">选择左侧列表进行编辑，或添加全新智能体配置</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelManagerModal;
