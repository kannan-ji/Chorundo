# chorundo? 🍛

> **"Have you eaten yet?"** — A dignity-first, community-driven nourishment network.

`chorundo?` (Malayalam for *"Have you had food?"*) is a modern, high-contrast, fully responsive platform designed to bridge the gap between hungry walk-in guests, generous donors, and local neighborhood kitchen systems without sacrificing human dignity.

---

## 🌟 The Principle

Traditional food charity programs often impose invasive tracking, long waiting lines, and bureaucracy, stripping individuals of their basic dignity. `chorundo?` operates on a revolutionary, dignity-first paradigm:
- **Athithi (Guest) Terminal**: Zero digital tracking, zero personal data tracking, and zero surveillance. Nourishment is an absolute right, not a privilege to be audited.
- **Donor Terminal**: Fully transparent meal sponsorships allowing individuals to fund verified partner kitchens and track collective impact.
- **Partner Kitchen Terminal**: Standardized operations allowing local, trusted community kitchens to log walk-in guests, scan voucher leaves, and manage live meal distribution seamlessly.

---

## 🛠️ App Architecture

The app is neatly segmented into modular terminals mapped directly to user roles:

```
┌─────────────────────────────────────────────────────────────────┐
│                           chorundo?                             │
│                  (Main Engagement Interface)                    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Athithi Terminal│     │ Donor Terminal  │     │ Kitchen Terminal│
│  • Get Vouchers │     │  • Fund Meals   │     │  • Scan Voucher │
│  • Find Kitchens│     │  • Track Stats  │     │  • Manage Leaf  │
│  • Live Status  │     │  • Select Hubs  │     │  • Walk-in Logs │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 1. Athithi Terminal (The Guest Experience)
- **Locate Kitchens**: Embedded local interactive status maps with kitchen proximity and real-time meal availability.
- **Interactive Vouchers**: Claim custom individual or family virtual vouchers with persistent, state-driven local session tracking.
- **Pure Privacy**: Purely client-side representation to ensure complete data security.

### 2. Donor Terminal (Community Sponsorship)
- **Sponsor Meal(s)**: Easy, responsive selection increments (1 to 50+ meals) to instantly fund live kitchen leaves.
- **Ledger & Metrics**: Real-time interactive summary charts tracking historic contributions, active kitchen status, and average preparation costs.
- **Hub Optimization**: Capability to direct funds straight to high-demand kitchen areas needing urgent balance refills.

### 3. Partner Kitchen Terminal (Nourishment Operations)
- **Leaf Balance State**: Live tracking of available kitchen credits (1 credit = 1 meal secured for a guest).
- **Redemption Suite**: Quick inputs for scanner voucher validation or manually logging anonymous offline walk-in guests.
- **Activity Stream**: A chronological operational feed showing prepare, ready, and served logs to keep track of daily operations.

---

## 💻 Tech Stack & Design Decisions

- **Framework**: `React (v18+)` & `Vite` for ultra-fast compilation and static deployment structures.
- **Language**: `TypeScript` with strict interface alignments ensuring type safety across terminals.
- **Styling**: `Tailwind CSS` styled around an elegant, high-contrast dark visual theme paired with ambient warm off-whites.
- **Animations**: `Framer Motion` (`motion/react`) for smooth, micro-expressive hover responses, staggered lists, and route transitions.
- **Icons**: `Lucide React` configured throughout the UI to maintain clean, professional, and consistent visual syntax.

---

## ⚡ Setup & Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <your-repository-url>

# Navigate into the project directory
cd chorundo

# Install dependencies
npm install
```

### Run Locally (Dev Server)
```bash
# Starts the development server with local proxy bindings
npm run dev
```
Open `http://localhost:3000` inside your browser to see the live app.

### Build and Compile
```bash
# Compile and build the production static bundle
npm run build
```
Compiled outputs are safely bundled inside the `/dist` directory, fully prepared for standard container routing or static web serving.

---

## ⚖️ License

Crafted with care for dignity-first community nourishment. Distributed under the MIT License.
