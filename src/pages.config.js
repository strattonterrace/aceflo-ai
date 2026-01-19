import Chat from './pages/Chat';
import Progress from './pages/Progress';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import Pulse from './pages/Pulse';
import Dashboard from './pages/Dashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Chat": Chat,
    "Progress": Progress,
    "Goals": Goals,
    "Settings": Settings,
    "Pulse": Pulse,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "Chat",
    Pages: PAGES,
    Layout: __Layout,
};