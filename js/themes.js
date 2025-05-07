/**
 * Theme management functionality
 * Handles theme switching and persistence using localStorage
 */

// Theme constants
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    DEVICE: 'device'
};

// Theme management object
const ThemeManager = {
    // Get the current theme from localStorage or default to device theme
    getCurrentTheme: function() {
        return localStorage.getItem('theme') || THEMES.DEVICE;
    },

    // Save theme preference to localStorage
    saveThemePreference: function(theme) {
        localStorage.setItem('theme', theme);
    },

    // Apply theme to the document body
    applyTheme: function(theme) {
        // Set the data-theme attribute on the body
        document.body.setAttribute('data-theme', theme);

        // If using device theme, check system preference
        if (theme === THEMES.DEVICE) {
            this.applyDeviceTheme();
        }

        // Update theme buttons to show which is active
        this.updateThemeButtons(theme);
    },

    // Apply theme based on system preference
    applyDeviceTheme: function() {
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        if (prefersDarkScheme.matches) {
            document.body.setAttribute('data-theme', THEMES.DARK);
        } else {
            document.body.setAttribute('data-theme', THEMES.LIGHT);
        }
    },

    // Update theme buttons to show which is active
    updateThemeButtons: function(activeTheme) {
        const themeButtons = document.querySelectorAll('.theme-btn');
        
        themeButtons.forEach(button => {
            const buttonTheme = button.getAttribute('data-theme');
            
            if (buttonTheme === activeTheme) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    },

    // Initialize theme functionality
    init: function() {
        // Apply the saved theme on page load
        const savedTheme = this.getCurrentTheme();
        this.applyTheme(savedTheme);

        // Set up event listeners for theme buttons
        document.addEventListener('DOMContentLoaded', () => {
            const themeButtons = document.querySelectorAll('.theme-btn');
            
            themeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const theme = button.getAttribute('data-theme');
                    this.saveThemePreference(theme);
                    this.applyTheme(theme);
                });
            });
        });

        // Listen for system theme changes
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        prefersDarkScheme.addEventListener('change', () => {
            if (this.getCurrentTheme() === THEMES.DEVICE) {
                this.applyDeviceTheme();
            }
        });
    }
};

// Initialize the theme manager
ThemeManager.init();
