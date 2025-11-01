# 📖 Guia de Transição Windows → Linux Pop-OS

## 🔄 Mapeamento de Comandos

### PowerShell (Windows) → Bash (Linux)

| Tarefa                | Windows (PowerShell)          | Linux (Bash)                        |
| --------------------- | ----------------------------- | ----------------------------------- |
| Listar arquivos       | `ls` ou `dir`                 | `ls -la`                            |
| Mudar diretório       | `cd pasta`                    | `cd pasta`                          |
| Copiar arquivo        | `Copy-Item file.txt dest/`    | `cp file.txt dest/`                 |
| Deletar arquivo       | `Remove-Item file.txt`        | `rm file.txt`                       |
| Deletar pasta         | `Remove-Item -Recurse pasta/` | `rm -rf pasta/`                     |
| Editar arquivo        | `notepad file.txt`            | `nano file.txt` (ou vim)            |
| Visualizar arquivo    | `Get-Content file.txt`        | `cat file.txt`                      |
| Procurar texto        | `Select-String "texto"`       | `grep "texto" file.txt`             |
| Variáveis de ambiente | `$Env:VARIAVEL`               | `$VARIAVEL`                         |
| Definir variável      | `$Env:VAR = "valor"`          | `export VAR="valor"`                |
| Executar script       | `.\script.ps1`                | `./script.sh` (ou `bash script.sh`) |
| Permissão executável  | Propriedades → Segurança      | `chmod +x script.sh`                |
| Processos             | `Get-Process`                 | `ps aux`                            |
| Matar processo        | `Stop-Process -Name proc`     | `kill -9 PID`                       |
| Porta em uso          | `netstat -ano`                | `sudo lsof -i :PORT`                |

---

## 💻 Equivalentes de Ferramentas

| Funcionalidade             | Windows                     | Linux                         |
| -------------------------- | --------------------------- | ----------------------------- |
| **Editor de Texto**        | Notepad++, VSCode           | nano, vim, VSCode             |
| **Terminal**               | PowerShell, CMD             | bash, zsh, GNOME Terminal     |
| **Gerenciador de Pacotes** | Chocolatey, Windows Package | apt, snap, npm                |
| **BD SQL**                 | SQL Server, pgAdmin         | PostgreSQL, pgAdmin, psql CLI |
| **Git**                    | Git for Windows             | git (nativo)                  |
| **Node.js**                | nodejs.org                  | apt, nvm, nodejs.org          |

---

## 🛠️ Tarefas Comuns

### Tarefa 1: Verificar Versão de Ferramenta

**Windows:**

```powershell
node --version
npm --version
git --version
```

**Linux:** (Idêntico)

```bash
node --version
npm --version
git --version
```

---

### Tarefa 2: Instalar Pacote Global

**Windows (PowerShell):**

```powershell
npm install -g supabase
# Pode precisar de admin
```

**Linux:**

```bash
npm install -g supabase
# Pode precisar de sudo
```

---

### Tarefa 3: Editar Arquivo .env

**Windows:**

```powershell
notepad .env
# ou no VSCode:
code .env
```

**Linux:**

```bash
nano .env
# ou no VSCode:
code .env
```

---

### Tarefa 4: Executar Script npm

**Windows:**

```powershell
npm run dev
npm run build
npm run lint
```

**Linux:** (Idêntico)

```bash
npm run dev
npm run build
npm run lint
```

---

### Tarefa 5: Usar PostgreSQL

**Windows:**

```powershell
# Precisava instalar pgAdmin ou psql manualmente
psql -h localhost -U postgres -d database_name
```

**Linux:**

```bash
# Instale com apt
sudo apt install -y postgresql-client

# Conecte:
psql -h localhost -U postgres -d database_name
```

---

### Tarefa 6: Buscar Porta em Uso

**Windows:**

```powershell
netstat -ano | findstr :5173
taskkill /PID 1234 /F
```

**Linux:**

```bash
sudo lsof -i :5173
kill -9 1234
```

---

## 📁 Estrutura de Caminhos

### Windows

```
C:\Users\andrey\barber-analytics-pro
C:\Users\andrey\barber-analytics-pro\.env
C:\Users\andrey\barber-analytics-pro\node_modules
```

### Linux

```
/home/andrey/barber-analytics-pro
/home/andrey/barber-analytics-pro/.env
/home/andrey/barber-analytics-pro/node_modules
```

---

## 🔐 Variáveis de Ambiente

### Windows (PowerShell)

```powershell
# Ver variável
$Env:VITE_SUPABASE_URL

# Definir variável (sessão atual)
$Env:VITE_SUPABASE_URL = "https://abc.supabase.co"

# Definir permanente (via arquivo .env)
```

### Linux (Bash)

```bash
# Ver variável
echo $VITE_SUPABASE_URL

# Definir variável (sessão atual)
export VITE_SUPABASE_URL="https://abc.supabase.co"

# Definir permanente (via arquivo .env)
```

---

## 🚀 Workflow Típico

### Desenvolvimento Diário

**Windows:**

```powershell
cd C:\Users\andrey\barber-analytics-pro
npm run dev
# Abrir http://localhost:5173
```

**Linux:**

```bash
cd /home/andrey/barber-analytics-pro
npm run dev
# Abrir http://localhost:5173
```

### Preparar Para Commit

**Windows:**

```powershell
npm run lint
npm run lint:fix
npm run format
git add .
git commit -m "feat: sua mensagem"
```

**Linux:** (Idêntico)

```bash
npm run lint
npm run lint:fix
npm run format
git add .
git commit -m "feat: sua mensagem"
```

### Fazer Build de Produção

**Windows:**

```powershell
npm run build
npm run preview
```

**Linux:** (Idêntico)

```bash
npm run build
npm run preview
```

---

## 🎯 Setup Inicial (Checklist)

- [ ] PostgreSQL Client instalado: `psql --version`
- [ ] Supabase CLI instalado: `supabase --version`
- [ ] Arquivo `.env` criado e configurado
- [ ] node_modules instalado: `npm list --depth=0`
- [ ] npm run dev testado
- [ ] Build testado: `npm run build`
- [ ] Lint passou: `npm run lint`

---

## 📚 Diferenças Importantes

### 1. **Permissões de Arquivo**

**Windows:**

- Permissões via UI do Windows
- Executáveis detectados por extensão `.exe`

**Linux:**

- Permissões via `chmod`
- Executáveis precisam de flag `x`

```bash
# Tornar arquivo executável
chmod +x setup-linux.sh

# Executar
./setup-linux.sh
```

---

### 2. **Case-Sensitive**

**Windows:**

- Nomes de arquivo: case-INSENSITIVE
- `File.txt` = `file.txt` = `FILE.TXT`

**Linux:**

- Nomes de arquivo: case-SENSITIVE
- `File.txt` ≠ `file.txt` ≠ `FILE.TXT`

```bash
# Cuidado! Estes são arquivos diferentes:
index.js
Index.js
INDEX.js
```

---

### 3. **Gerenciador de Pacotes**

**Windows:**

- Sem gerenciador nativo
- Usa Chocolatey, Scoop, Windows Package Manager

**Linux:**

- `apt` (Debian/Ubuntu/Pop-OS)
- `dnf` (Fedora)
- `pacman` (Arch)

```bash
# Pop-OS usa apt:
sudo apt update
sudo apt install pacote-nome
sudo apt remove pacote-nome
```

---

### 4. **Path Separators**

**Windows:**

```powershell
C:\Users\andrey\folder\file.txt
# Ou usar /
C:/Users/andrey/folder/file.txt
```

**Linux:**

```bash
/home/andrey/folder/file.txt
# Sempre /
```

---

## 💡 Dicas Pro

### 1. Salvar Comandos Frequentes

**Criar alias no `.bashrc`:**

```bash
# Abrir editor
nano ~/.bashrc

# Adicionar ao final:
alias barber="cd /home/andrey/barber-analytics-pro && npm run dev"
alias pbuild="cd /home/andrey/barber-analytics-pro && npm run build"

# Recarregar:
source ~/.bashrc

# Usar:
barber  # Vai executar: cd ... && npm run dev
pbuild  # Vai executar: cd ... && npm run build
```

### 2. Terminal Melhorado

```bash
# Instalar oh-my-zsh (opcional mas recomendado)
curl https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh | bash

# Instalar starship (prompt bonito)
curl -sS https://starship.rs/install.sh | sh
```

### 3. Git Config

```bash
# Configurar git (primeira vez)
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Ver config
git config --list
```

### 4. SSH para GitHub

```bash
# Gerar chave SSH
ssh-keygen -t ed25519 -C "seu@email.com"

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar em: https://github.com/settings/keys
```

---

## 🆘 Problemas Comuns

### Erro: "Permission denied"

```bash
# Problema: Arquivo não tem permissão de execução
chmod +x arquivo.sh
./arquivo.sh
```

### Erro: "Command not found"

```bash
# Problema: Comando não está no PATH
# Solução: Instale com apt ou npm

sudo apt install comando
# ou
npm install -g modulo
```

### Erro: "sudo: command not found"

```bash
# Problema: Você está em uma VM ou container sem sudo
# Solução: Use o usuário root ou configure sudoers
```

---

## 📞 Recursos Úteis

- **Linux Bash Guide:** https://www.gnu.org/software/bash/manual/
- **Pop-OS Docs:** https://support.system76.com/articles/pop-os/
- **PostgreSQL CLI:** https://www.postgresql.org/docs/current/app-psql.html
- **Supabase CLI:** https://supabase.com/docs/reference/cli/introduction
- **npm scripts:** https://docs.npmjs.com/cli/v8/using-npm/scripts

---

_Última atualização: 1º de novembro de 2025_
_Ambiente: Linux Pop-OS | Migração Windows → Linux_
