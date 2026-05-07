import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, UserPlus, Shield, ChevronDown, Info } from 'lucide-react';
import { toast } from 'sonner';
import { userProfilesService } from '@/services/userProfilesService';
import { RoleGuard } from '@/components/auth/RoleGuard';
import type { UserProfile, UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
  ceo: 'CEO',
  gestor_vcchic: 'Gestor VcChic',
  vendedor_sdr: 'Vendedor / SDR',
  assistente: 'Assistente',
};

const ROLE_COLORS: Record<UserRole, string> = {
  ceo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  gestor_vcchic: 'bg-pink-50 text-pink-700 border-pink-200',
  vendedor_sdr: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  assistente: 'bg-slate-50 text-slate-600 border-slate-200',
};

const ALL_ROLES: UserRole[] = ['ceo', 'gestor_vcchic', 'vendedor_sdr', 'assistente'];

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${ROLE_COLORS[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function UserRow({
  profile,
  onRoleChange,
}: {
  profile: UserProfile;
  onRoleChange: (id: string, role: UserRole) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const initials = (profile.fullName ?? profile.email ?? '?').slice(0, 2).toUpperCase();

  const handleRoleChange = async (role: UserRole) => {
    setOpen(false);
    if (role === profile.role) return;
    setUpdating(true);
    await onRoleChange(profile.id, role);
    setUpdating(false);
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
          <span className="text-xs font-black text-indigo-600">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{profile.fullName ?? '—'}</p>
          <p className="text-xs text-slate-400 truncate">{profile.email ?? profile.id.slice(0, 8) + '...'}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {profile.onboardedAt && (
          <span className="text-[10px] text-slate-400 hidden sm:block">
            Ativo desde {new Date(profile.onboardedAt).toLocaleDateString('pt-BR')}
          </span>
        )}

        {/* Role dropdown */}
        <div className="relative">
          <button
            disabled={updating}
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RoleBadge role={profile.role} />
            <ChevronDown size={12} className="text-slate-400" />
          </button>
          {open && (
            <div className="absolute right-0 top-9 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden w-44">
              {ALL_ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-slate-50 transition-all ${r === profile.role ? 'opacity-50 cursor-default' : ''}`}
                >
                  <RoleBadge role={r} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Users: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('assistente');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    userProfilesService.getAll().then(({ data }) => {
      setProfiles(data ?? []);
      setLoading(false);
    });
  }, []);

  const handleRoleChange = async (id: string, role: UserRole) => {
    const { error } = await userProfilesService.updateRole(id, role);
    if (error) {
      toast.error('Erro ao atualizar papel');
      return;
    }
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, role } : p));
    toast.success(`Papel atualizado para ${ROLE_LABELS[role]}`);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim()) { toast.error('UUID obrigatório'); return; }
    setAdding(true);
    const { error } = await userProfilesService.create({
      id: newId.trim(),
      role: newRole,
      fullName: newName.trim() || undefined,
      email: newEmail.trim() || undefined,
    });
    setAdding(false);
    if (error) { toast.error(`Erro: ${error}`); return; }
    const { data } = await userProfilesService.getAll();
    setProfiles(data ?? []);
    setShowAddForm(false);
    setNewId(''); setNewName(''); setNewEmail(''); setNewRole('assistente');
    toast.success('Usuário adicionado');
  };

  return (
    <RoleGuard roles={['ceo']}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Usuários</h1>
            <p className="text-slate-500 text-sm mt-1">Gerencie o acesso e os papéis do time no Nexus OS</p>
          </div>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 transition-all"
          >
            <UserPlus size={14} /> Adicionar usuário
          </button>
        </div>

        {/* Instrução de invite */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700 leading-relaxed">
            <strong>Como adicionar um usuário:</strong> Crie a conta primeiro em{' '}
            <span className="font-mono">Supabase Dashboard → Authentication → Users → Invite</span>.
            Após o usuário aceitar o convite e fazer login, copie o UUID gerado e cole abaixo para definir o papel.
          </div>
        </div>

        {/* Formulário de adição */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Shield size={14} className="text-indigo-500" /> Novo perfil de acesso
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">UUID (Supabase Auth) *</label>
                <input
                  value={newId}
                  onChange={e => setNewId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Papel</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as UserRole)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {ALL_ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nome completo</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Nome do usuário"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={adding} className="px-4 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all">
                {adding ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        )}

        {/* Lista de usuários */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <UsersIcon size={16} className="text-indigo-500" />
            <h2 className="text-sm font-black text-slate-900">
              {loading ? '...' : `${profiles.length} ${profiles.length === 1 ? 'usuário' : 'usuários'}`}
            </h2>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum perfil cadastrado ainda.</p>
          ) : (
            profiles.map(p => (
              <React.Fragment key={p.id}>
                <UserRow profile={p} onRoleChange={handleRoleChange} />
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
};

export default Users;
