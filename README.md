# 📘 Panduan Setup, Clone, & Standar Workflow Pengembangan NETRA (Frontend)

Dokumen ini disusun sebagai panduan bagi anggota baru tim **NETRA-UGM** untuk mengakses repository, menjalankan **NETRA Frontend** di laptop, mengerjakan fitur, dan berkolaborasi menggunakan Git dengan alur yang aman dan konsisten.

**Repository:** [NETRA-UGM/Netra-frontend](https://github.com/NETRA-UGM/Netra-frontend)  
**Teknologi:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, pnpm  
**Branch utama:** `main` (stabil) dan `dev` (integrasi pengembangan)

> 📌 **Cakupan:** Panduan ini khusus frontend. Langkah menjalankan backend, database, dan kredensial login belum didokumentasikan karena konfigurasi backend NETRA belum diverifikasi. Mintalah pengaturan API dan environment kepada pengelola proyek.

> 📌 **Pembaruan Quality Gate:** Panduan ini memakai tiga perintah (`pnpm run lint`, `pnpm run typecheck`, `pnpm run build`). Pastikan perubahan ESLint (`eslint.config.mjs`, script `lint` di `package.json`, dependencies, dan langkah lint di workflow CI) sudah di-merge ke `dev`/`main` sebelum anggota mengikuti panduan ini.

---

## 🛠️ 1. Persiapan Environment Global di Laptop

Sebelum mengakses repository, pasang perangkat lunak berikut.

### A. Git

- **Unduh & pasang:** https://git-scm.com/
- **Konfigurasi identitas** (cukup sekali per laptop):

```powershell
git config --global user.name "Nama Lengkap Anda"
git config --global user.email "email-github-anda@example.com"
```

- **Verifikasi:**

```powershell
git --version
```

### B. Node.js (Versi 22 untuk menyelaraskan dengan CI)

- **Unduh:** https://nodejs.org/
- **Verifikasi:**

```powershell
node --version
```

> CI NETRA menggunakan Node.js 22. Gunakan versi yang kompatibel agar hasil pengujian lokal dan CI konsisten.

### C. pnpm (Package Manager)

Frontend NETRA menggunakan **pnpm**, bukan npm/yarn, dengan file `pnpm-lock.yaml` (lockfileVersion `9.0`). Workflow CI menggunakan **pnpm 10**.

Jika Node.js menyediakan Corepack:

```powershell
corepack enable
corepack prepare pnpm@10 --activate
pnpm --version
```

Jika Corepack tidak tersedia atau tidak dapat digunakan, instal pnpm 10 dengan metode resmi yang sesuai. Dokumentasi: https://pnpm.io/installation

> Jangan mengubah `pnpm-lock.yaml` hanya karena menjalankan instalasi dengan package manager berbeda. Jika instalasi bermasalah, koordinasikan versi pnpm dengan pengelola.

### D. Visual Studio Code

- **Unduh:** https://code.visualstudio.com/
- Gunakan menu **File → Open Folder** untuk membuka folder repository yang sudah di-clone.

### E. Akses GitHub

- Masuk ke akun GitHub masing-masing.
- Repository `Netra-frontend` saat ini **Public**, tetapi izin **Write** diperlukan untuk mengirim branch langsung ke repository organisasi.
- Jika belum memiliki akses Write, minta undangan dari pengelola NETRA. Jangan meminta akses Admin untuk kebutuhan coding rutin.

---

## 🖥️ 2. Tips Penting: Buka Terminal Terpisah (Multi-Terminal)

Disarankan menggunakan dua atau tiga tab terminal di VS Code agar proses pengembangan tidak saling mengganggu.

```text
🖥️ Terminal 1 — Frontend Development Server
   Folder: ...\NETRA\Netra-frontend
   Perintah: pnpm dev

🖥️ Terminal 2 — Git & Branch
   Folder: ...\NETRA\Netra-frontend
   Perintah: git status, git pull, git commit, git push

🖥️ Terminal 3 — Quality Checks (Opsional)
   Folder: ...\NETRA\Netra-frontend
   Perintah: pnpm run lint, pnpm run typecheck, pnpm run build
```

> ⚠️ **Catatan penting:** Jangan menjalankan perintah frontend di folder `NETRA` induk atau di folder `backend`. Selalu pastikan terminal berada di folder **`Netra-frontend` yang memiliki `package.json`**.

---

## 🚀 3. Panduan Step-by-Step Clone & Menjalankan Project

### Step 1: Clone Repository Frontend

1. Buka **PowerShell** atau terminal VS Code pada direktori kerja yang diinginkan.
2. Jalankan:

```powershell
# Contoh: pindah ke lokasi kerja (sesuaikan dengan laptop masing-masing)
cd "$HOME\Desktop"

# Clone repository resmi NETRA
git clone https://github.com/NETRA-UGM/Netra-frontend.git

# Wajib masuk ke folder hasil clone
cd Netra-frontend
```

> Jangan melakukan `git init` di folder hasil clone. Repository sudah memiliki riwayat Git, branch, dan workflow GitHub Actions.

### Step 2: Beralih ke Branch `dev`

```powershell
git checkout dev
git pull origin dev
```

`dev` adalah basis pengembangan harian. **Jangan mengerjakan task langsung di `dev` atau `main`.**

### Step 3: Install Dependencies

```powershell
pnpm install --frozen-lockfile
```

Perintah ini memasang dependencies sesuai lockfile dan akan membuat folder `node_modules` secara lokal.

### Step 4: Siapkan Environment File (`.env.local`)

Next.js menggunakan `.env.local` untuk konfigurasi development lokal. Jika tersedia contoh environment, salin:

```powershell
Copy-Item .env.example .env.local
```

Kemudian edit `.env.local` sesuai nilai dari pengelola proyek. **Jangan mengarang alamat backend, API key, ataupun kredensial login.**

> 🔐 `.env.local` dan file yang mengandung rahasia **tidak boleh di-commit**. Periksa pula `.env.example`: file contoh tidak boleh berisi password/token asli. Karena repository Public, semua kode yang dipush dapat dilihat publik.

### Step 5: Jalankan Frontend

```powershell
pnpm dev
```

> 🟢 Akses aplikasi melalui **http://localhost:3000** (port default Next.js; bisa berubah jika port tersebut terpakai). Biarkan terminal development server terbuka selama aplikasi digunakan. Tekan `Ctrl + C` untuk menghentikannya.

### Step 6: Quality Gate Lokal

Sebelum membuat PR, jalankan ketiga Quality Gate berikut satu per satu:

```powershell
pnpm run lint        # Memeriksa kualitas kode (ESLint)
pnpm run typecheck   # Memeriksa kesalahan TypeScript
pnpm run build       # Memastikan build produksi berhasil
```

> 🛑 Jika ada **error**, perbaiki dahulu. Peringatan (*warning*) dari ESLint perlu diperiksa, tetapi tidak otomatis menyebabkan lint gagal. Pemeriksaan automated test terpisah belum didokumentasikan dalam proyek ini.

---

## 🌿 4. Alur Kerja Git & Aturan Branch (SOP Developer)

Untuk menghindari benturan antar developer, NETRA menggunakan alur branch berikut:

### 📐 Hierarki & Pohon Branch

```text
[main]                         ← Stable / rilis; bukan tempat coding harian
   ▲
   │ Pull Request dari dev saja
[dev]                          ← Pusat integrasi pengembangan
   ▲
   │ Pull Request + GitHub Actions wajib Passed
   ├── feature/ec2-dashboard
   ├── feature/vpc-topology
   ├── fix/login-redirect
   ├── hotfix/auth-session
   ├── docs/update-readme
   ├── style/responsive-sidebar
   ├── refactor/api-handler
   └── chore/frontend-ci
```

### 📏 Standar Nama Branch

Gunakan **`kategori/nama-pekerjaan`** (huruf kecil, kata dipisahkan tanda `-`).

| Prefix | Kapan dipakai | Contoh |
|---|---|---|
| `feature/*` | Menambahkan fitur | `feature/ec2-dashboard` |
| `fix/*` | Memperbaiki bug | `fix/login-redirect` |
| `hotfix/*` | Perbaikan mendesak | `hotfix/auth-session` |
| `docs/*` | Dokumentasi | `docs/update-readme` |
| `style/*` | Perubahan CSS/UI | `style/responsive-sidebar` |
| `refactor/*` | Merapikan struktur tanpa mengubah fungsi | `refactor/api-handler` |
| `chore/*` | Dependensi, konfigurasi, CI | `chore/frontend-ci` |

> ⚠️ **Jangan gunakan `feat/*` sebagai nama branch.** NETRA memakai **`feature/*` untuk branch** dan **`feat` untuk tipe commit**. Workflow `NETRA Branch Policy` memvalidasi prefix branch tersebut.

### 🔄 Siklus Pengerjaan Fitur Baru (Step-by-Step)

#### 1. Selaraskan `dev` Lokal Sebelum Memulai Task Baru

Pastikan pekerjaan lokal yang belum selesai sudah diamankan, lalu:

```powershell
git checkout dev
git pull origin dev
```

#### 2. Buat Branch Baru dari `dev`

```powershell
git checkout -b feature/ec2-dashboard
```

> Gunakan satu branch per task atau perubahan yang saling berkaitan. Jangan membuat branch fitur dari `main`.

#### 3. Ngoding & Cek Status Secara Berkala

```powershell
git status
git diff
```

#### 4. Sinkronkan Branch Fitur Jika `dev` Berubah

Saat masih berada di branch fitur:

```powershell
git fetch origin
git merge origin/dev
```

Jika ada konflik, selesaikan file yang konflik dengan teliti, lalu jalankan pemeriksaan lokal kembali. Hindari berpindah branch ketika masih ada perubahan yang belum diamankan.

#### 5. Wajib Uji Kualitas Sebelum Push (Quality Gate Lokal)

```powershell
pnpm run lint        # Memeriksa kualitas kode (ESLint)
pnpm run typecheck   # Memeriksa kesalahan TypeScript
pnpm run build       # Memastikan build produksi berhasil
```

> 🛑 Jangan membuat PR jika lint, TypeScript, atau build masih error. Untuk perubahan UI atau alur login, lakukan juga pengujian manual. Warning ESLint sebaiknya diperbaiki jika memungkinkan.

#### 6. Commit Menggunakan Conventional Commits

```powershell
git status
git add .
git commit -m "feat(ec2): add instance dashboard layout"
```

> Sebelum `git add .`, pastikan `.gitignore` sudah benar dan tidak ada `node_modules`, `.next`, `.env.local`, kredensial, atau file sementara yang ikut dimasukkan.

#### 7. Push Branch ke GitHub

```powershell
git push -u origin feature/ec2-dashboard
```

Untuk push berikutnya pada branch yang sama:

```powershell
git push
```

> 💡 **Catatan CI:** GitHub Actions NETRA berjalan pada **Pull Request ke `dev` atau `main`**, bukan otomatis pada setiap push branch tanpa PR. Setelah PR dibuka, push commit tambahan akan memicu pemeriksaan ulang. Langkah ESLint di CI perlu sudah digabungkan ke workflow agar ketiga Quality Gate juga diuji otomatis.

#### 8. Buka Pull Request (PR) ke `dev`

1. Buka [repository NETRA Frontend](https://github.com/NETRA-UGM/Netra-frontend).
2. Klik **Compare & pull request**, atau buka tab **Pull requests → New pull request**.
3. **Wajib:** `base: dev` dan `compare: feature/nama-task` (atau prefix lain yang diizinkan).
4. Isi judul, deskripsi perubahan, cara pengujian, dan screenshot jika terkait UI.
5. Periksa status GitHub Actions:
   - **NETRA Branch Policy / Validate Branch Policy** — penamaan dan arah PR.
   - **NETRA Frontend CI / Frontend CI** — ESLint, TypeScript check, dan build Next.js, setelah perubahan workflow ESLint digabungkan.
6. Jika semua required checks **Passed** dan tidak ada konflik/persyaratan lain, PR dapat di-merge ke `dev` tanpa approval manusia pada konfigurasi saat ini.
7. Jika ada check **Failed**, buka **Details**, perbaiki masalah, lalu commit dan push kembali.

#### 9. Setelah Merge: Bersihkan Branch dan Mulai Task Baru

Setelah PR berhasil di-merge dan branch tidak lagi diperlukan, hapus branch sementara di GitHub (atau biarkan auto-delete yang sudah diatur). Jangan hapus `main` maupun `dev`.

Untuk kembali bekerja:

```powershell
git checkout dev
git pull origin dev
```

Jika branch fitur lama sudah dihapus dari GitHub dan tidak dibutuhkan:

```powershell
git branch -d feature/ec2-dashboard
```

#### 10. Rilis ke `main` (Hanya Saat Versi Stabil)

1. Setelah fitur-fitur di `dev` selesai dan teruji, buat PR **`dev` → `main`**.
2. Pastikan **Validate Branch Policy** dan **Frontend CI** Passed, dan lakukan pemeriksaan fungsional seperlunya.
3. Mintalah approval apabila kebijakan reviewer sudah diaktifkan.
4. Merge ke `main` hanya ketika versi dinyatakan layak rilis.

> Branch `main` bukan target PR fitur harian. **Jangan menghapus `dev`** setelah rilis.

### 🛡️ Aturan Rulesets Saat Ini

| Aturan | `dev` | `main` |
|---|---|---|
| Pull Request wajib | Ya | Ya |
| Validasi Branch Policy wajib | Ya | Ya |
| Frontend CI wajib | Ya | Ya |
| Approval | 0 | 0 sementara (belum ada reviewer) |
| Force push | Diblokir | Diblokir |

> Ketika reviewer NETRA tersedia, pengelola akan mengaktifkan **minimal 1 approval untuk PR ke `main`**. Anggota biasa cukup diberi akses Write dan tidak perlu mengubah Rulesets atau GitHub Actions sendiri. Proteksi hanya efektif selama tidak ada aktor yang menggunakan izin bypass.

---

## 📝 5. Panduan Standar Format Commit (Conventional Commits)

Format pesan commit:

```text
<tipe>(<scope>): <keterangan singkat>
```

| Tipe | Kapan digunakan | Contoh pesan commit |
|---|---|---|
| `feat` | Menambahkan fitur atau halaman baru | `feat(ec2): add instance configuration form` |
| `fix` | Memperbaiki bug | `fix(auth): resolve login redirect issue` |
| `docs` | Memperbarui dokumentasi | `docs(readme): update installation guide` |
| `style` | Mengubah tampilan/spacing | `style(sidebar): adjust mobile navigation padding` |
| `refactor` | Mengubah struktur tanpa mengubah perilaku | `refactor(vpc): simplify subnet handler` |
| `chore` | Dependensi, build script, konfigurasi CI | `chore(ci): update frontend workflow` |

**Ketentuan:** tulis singkat dan jelas, gunakan scope yang relevan (`auth`, `ec2`, `vpc`, `ci`, `readme`), serta hindari pesan umum seperti `update` atau `final`. Satu branch boleh memiliki beberapa commit dengan tipe berbeda.

> GitHub Actions NETRA **belum** otomatis memvalidasi pesan Conventional Commits. Ini adalah standar tim sampai workflow pemeriksa commit ditambahkan.

---

## 💡 6. Tips Mengatasi Masalah Umum Pemula

### 1. "Saya lupa pindah branch dan terlanjur ngoding di `dev`!"

Jika perubahan **belum di-commit**, buat branch baru dari kondisi kerja saat ini:

```powershell
git checkout -b feature/nama-task
```

Periksa `git status` sebelum dan sesudahnya. Jika sudah ada commit di `dev`, jangan lakukan reset/force push sembarangan; koordinasikan dengan pengelola.

### 2. "Branch lokal saya tertinggal dari `dev`!"

Untuk memperbarui branch fitur yang sedang dikerjakan:

```powershell
git fetch origin
git merge origin/dev
```

Jika hendak membuat **task baru**, kembali ke `dev` terlebih dahulu dan jalankan `git pull origin dev`.

### 3. "Push ditolak: non-fast-forward"

Biasanya branch remote sudah berisi commit yang belum ada di lokal. Periksa status, lakukan `git fetch origin`, lalu sinkronkan **branch yang sama**. Jangan menggunakan `git push --force` untuk menyelesaikan masalah ini.

### 4. "PR menampilkan `Validate Branch Policy` Failed"

Pastikan `feature/*`, `fix/*`, `hotfix/*`, `docs/*`, `style/*`, `refactor/*`, atau `chore/*` ditujukan ke `dev`. Hanya `dev` dari repository NETRA yang sama diizinkan ke `main`.

### 5. "PR menampilkan `Frontend CI` Failed"

Klik tab **Checks** atau tautan **Details**, lalu lihat apakah kegagalan berasal dari instalasi pnpm, `pnpm run lint`, `pnpm run typecheck`, atau `pnpm run build`. Perbaiki di branch kerja, commit, dan push lagi. **Jangan mematikan required checks** hanya untuk meloloskan PR.

### 6. "Ada merge conflict"

Buka file yang bertanda konflik dan putuskan perubahan mana yang benar; jangan asal memilih seluruh perubahan satu sisi. Setelah terselesaikan, jalankan `pnpm run lint`, `pnpm run typecheck`, dan `pnpm run build`, lalu commit penyelesaiannya jika diperlukan.

### 7. "Website tidak bisa dibuka di localhost:3000"

Pastikan `pnpm dev` masih berjalan dan terminal berada di folder frontend. Periksa apakah Next.js memilih port lain karena port 3000 sudah digunakan. Untuk fitur yang menggunakan API, pastikan konfigurasi backend sudah tersedia.

---

## ✅ Ringkasan Rutinitas Harian

```text
MULAI TASK BARU
  ↓
git checkout dev → git pull origin dev
  ↓
git checkout -b feature/nama-task
  ↓
Ngoding → git status → sinkronkan dev bila perlu
  ↓
pnpm run lint → pnpm run typecheck → pnpm run build
  ↓
git add . → git commit → git push
  ↓
Buka PR ke dev → tunggu Branch Policy & Frontend CI Passed
  ↓
Merge → hapus branch sementara → ulangi untuk task selanjutnya

RILIS: hanya PR dev → main ketika dinyatakan stabil
```

**Referensi:** [Repository NETRA](https://github.com/NETRA-UGM/Netra-frontend) · [Git](https://git-scm.com/doc) · [GitHub Actions](https://docs.github.com/en/actions) · [Next.js](https://nextjs.org/docs) · [pnpm](https://pnpm.io/) · [Conventional Commits](https://www.conventionalcommits.org/)

*NETRA Development Team — Build collaboratively, validate continuously.*
