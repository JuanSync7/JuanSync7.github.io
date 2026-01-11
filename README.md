Shew Juan Kok - ASIC Design Engineer Portfolio

A creative, single-file portfolio website designed for an ASIC Design Engineer. This project utilizes a "zero-build" architecture, running React and Tailwind CSS directly in the browser via CDN and Babel Standalone.

⚡ Features

🎨 Thematic Design (ASIC/Hardware)

Chip Package Layout: The "About" section simulates a physical chip package with metallic pins and silk-screen text.

Logic Gate Dividers: Animated inverter chains (NOT gates) act as section dividers, simulating signal propagation.

FSM Life Cycle: A fully responsive, animated Finite State Machine (FSM) diagram visualizing the engineer's daily routine.

PCB/Grid Background: Custom CSS patterns resembling floorplans or PCB traces.

🛠 Tech Stack

Core: HTML5

Styling: Tailwind CSS (via CDN)

Framework: React 18 & ReactDOM (via ESM Importmap)

Compiler: Babel Standalone (Compiles JSX in the browser)

Icons: Lucide React

Data: GitHub REST API (Fetches repositories dynamically)

🚀 How to Run

Because this project uses the Babel Standalone compiler and ES Modules, it is best run on a local server to avoid Cross-Origin Resource Sharing (CORS) policies associated with the file:// protocol.

Option 1: VS Code Live Server (Recommended)

Open the project folder in VS Code.

Install the "Live Server" extension.

Right-click index.html and select "Open with Live Server".

Option 2: Python Simple Server

If you have Python installed, run this command in the project directory:

# Python 3
python -m http.server 8000


Then open http://localhost:8000 in your browser.

📂 Project Structure

Everything is contained within a single index.html file for portability.

<head>: Loads Tailwind, React, Babel, and Lucide. Defines custom CSS animations (@keyframes flow, pin-gradient).

<body>: Contains the #root div and the main <script type="text/babel">.

Components:

App: Main container and routing logic.

ChipPackage: The central visual element for the hero section.

LifeCycleFSM: The responsive SVG-based state machine animation.

InverterChainDivider: The logic gate animation between sections.

ProjectCard: Displays GitHub repository data.

CharacterCanvas: The bouncing ball/antenna animation at the footer.

⚙️ Configuration

To customize the portfolio for your own use, look for the following variables in the <script> tag:

GitHub Data:
Search for the useEffect in the App component and change the username:

fetch('[https://api.github.com/users/YOUR_USERNAME/repos?sort=updated&per_page=12](https://api.github.com/users/YOUR_USERNAME/repos?sort=updated&per_page=12)')


Profile Image:
In the Sidebar component:

<img src="[https://github.com/YOUR_USERNAME.png](https://github.com/YOUR_USERNAME.png)" ... />


Hobbies & FSM:

Edit the hobbies array in CharacterCanvas to change the bouncing text labels.

Modify the nodes and connections objects in LifeCycleFSM to change the state machine diagram.

📱 Responsiveness

The site is fully responsive:

Mobile: Sidebar collapses into a top/bottom navigation structure (or simplifies). The FSM diagram scales down using a CSS transform based on window width.

Desktop: Full sidebar navigation and wide-screen layouts for the Chip Package.

Dark Mode: Fully supported via Tailwind's dark: classes and a manual toggle state.

📄 License

This project is open source. Feel free to use it as a template for your own portfolio!