import React, { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, AlertTriangle, RefreshCw, X, Search, KeyRound } from 'lucide-react';
import { authFetch } from '../services/authService';

interface UserStats {
  id: number;
  username: string;
  created_at: string;
  is_blocked: boolean;
  is_admin: boolean;
  today_count: number;
  total_count: number;
  days_active: number;
  storage_mb: number;
}

interface AuditLog {
  id: number;
  date: string;
  username: string;
  title: string;
  is_suspicious: number;
  reason: string;
}

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'users' | 'audit'>('users');
  const [users, setUsers] = useState<UserStats[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditDate, setAuditDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const loadUsers = async () => {
    try {
      const resp = await authFetch('/api/admin/users');
      const data = await resp.json();
      setUsers(data.users || []);
    } catch { setUsers([]); }
  };

  const loadAudit = async (date?: string) => {
    try {
      const url = date ? `/api/admin/audit?date=${date}` : '/api/admin/audit';
      const resp = await authFetch(url);
      const data = await resp.json();
      setAuditLogs(data.logs || []);
      setAuditDate(data.date || '');
    } catch { setAuditLogs([]); }
  };

  useEffect(() => { loadUsers(); loadAudit(); }, []);

  const handleBlockToggle = async (userId: number, currentlyBlocked: boolean) => {
    const endpoint = currentlyBlocked ? `/api/admin/unblock/${userId}` : `/api/admin/block/${userId}`;
    await authFetch(endpoint, { method: 'POST' });
    loadUsers();
  };

  const handleResetPassword = async (userId: number) => {
    if (resetPassword.length < 6) {
      setMessage('新密码至少 6 位');
      return;
    }
    try {
      const resp = await authFetch(`/api/admin/reset-password/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: resetPassword }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setMessage(`已重置 ${users.find(u => u.id === userId)?.username || ''} 的密码`);
      } else {
        setMessage(data.error || '重置失败');
      }
    } catch {
      setMessage('网络错误');
    }
    setResetUserId(null);
    setResetPassword('');
  };

  const handleRunAudit = async () => {
    setLoading(true);
    setMessage('');
    try {
      const resp = await authFetch('/api/admin/audit/run', { method: 'POST' });
      const data = await resp.json();
      setMessage(data.message || '审计完成');
      loadAudit();
    } catch {
      setMessage('审计执行失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col border border-slate-200/60">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Shield size={16} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">管理员面板</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* 标签 */}
        <div className="flex border-b border-slate-100 px-6 gap-1">
          <button
            onClick={() => setTab('users')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              tab === 'users' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            用户管理
          </button>
          <button
            onClick={() => { setTab('audit'); loadAudit(); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              tab === 'audit' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            审计日志
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-slate-500">共 {users.length} 个用户</span>
                <button onClick={loadUsers} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 text-left text-slate-500">
                      <th className="px-4 py-3 font-medium">用户名</th>
                      <th className="px-4 py-3 font-medium">今日</th>
                      <th className="px-4 py-3 font-medium">总计</th>
                      <th className="px-4 py-3 font-medium">活跃天数</th>
                      <th className="px-4 py-3 font-medium">存储(MB)</th>
                      <th className="px-4 py-3 font-medium">状态</th>
                      <th className="px-4 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {u.username}
                          {u.is_admin && <span className="ml-1.5 text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full font-semibold">管理员</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{u.today_count}</td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{u.total_count}</td>
                        <td className="px-4 py-3 text-slate-600">{u.days_active}</td>
                        <td className={`px-4 py-3 ${u.storage_mb > 900 ? 'text-red-500 font-medium' : 'text-slate-600'}`}>
                          {u.storage_mb}
                        </td>
                        <td className="px-4 py-3">
                          {u.is_blocked ? (
                            <span className="text-red-500 text-xs font-medium bg-red-50 px-2 py-0.5 rounded-full">已封禁</span>
                          ) : (
                            <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">正常</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {!u.is_admin && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleBlockToggle(u.id, u.is_blocked)}
                                className={`text-xs px-2 py-1 rounded-lg ${
                                  u.is_blocked
                                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                              >
                                {u.is_blocked ? (
                                  <span className="flex items-center gap-1"><Unlock size={12} /> 解锁</span>
                                ) : (
                                  <span className="flex items-center gap-1"><Lock size={12} /> 封禁</span>
                                )}
                              </button>
                              <button
                                onClick={() => { setResetUserId(u.id); setResetPassword(''); setMessage(''); }}
                                className="text-xs px-2 py-1 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100"
                              >
                                <span className="flex items-center gap-1"><KeyRound size={12} /> 重置密码</span>
                              </button>
                            </div>
                          )}
                          {resetUserId === u.id && (
                            <div className="flex items-center gap-1 mt-2">
                              <input
                                type="text" placeholder="输入新密码" value={resetPassword}
                                onChange={e => setResetPassword(e.target.value)}
                                className="text-xs px-2 py-1 border border-slate-200 rounded-lg w-28 outline-none focus:ring-1 focus:ring-brand-500 bg-slate-50"
                              />
                              <button onClick={() => handleResetPassword(u.id)}
                                className="text-xs px-2 py-1 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100">确认</button>
                              <button onClick={() => { setResetUserId(null); setResetPassword(''); }}
                                className="text-xs px-2 py-1 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100">取消</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {message && <div className="mt-3 text-sm text-brand-600 bg-brand-50 px-3 py-2 rounded-xl">{message}</div>}
            </div>
          )}

          {tab === 'audit' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-slate-500">审计日期: {auditDate || '加载中...'}</span>
                <div className="flex items-center gap-2">
                  {message && <span className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">{message}</span>}
                  <button
                    onClick={handleRunAudit} disabled={loading}
                    className="text-xs px-3 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg flex items-center gap-1.5 font-medium"
                  >
                    <Search size={12} />
                    {loading ? '审计中...' : '执行审计'}
                  </button>
                </div>
              </div>

              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  暂无审计记录。点击"执行审计"可对前一天的文档标题进行 AI 审计。
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map(log => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-xl border ${
                        log.is_suspicious
                          ? 'border-red-200 bg-red-50/50'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-sm font-medium text-slate-700">{log.username}</span>
                          <span className="mx-2 text-slate-300">|</span>
                          <span className="text-sm text-slate-600">{log.title}</span>
                        </div>
                        {log.is_suspicious ? (
                          <span className="flex items-center gap-1 text-xs text-red-500 font-medium bg-red-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={11} /> 可疑
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">正常</span>
                        )}
                      </div>
                      {log.reason && <div className="text-xs text-slate-500 mt-1.5">{log.reason}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
