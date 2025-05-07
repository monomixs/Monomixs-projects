/**
 * Main JavaScript file
 * Initializes all components and handles global functionality
 */

// Toast notification utility
const Toast = {
    container: null,
    
    // Initialize the toast container
    init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toastContainer';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    // Show a toast notification
    show(message, type = 'info', duration = 3000) {
        if (!this.container) this.init();
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        // Add progress bar
        const progress = document.createElement('div');
        progress.className = 'toast-progress';
        toast.appendChild(progress);
        
        // Add to container
        this.container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
            progress.style.animation = `shrink ${duration}ms linear forwards`;
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300); // Wait for fade out animation
        }, duration);
    },
    
    // Type-specific methods for convenience
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    },
    
    error(message, duration = 3000) {
        this.show(message, 'error', duration);
    },
    
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
};

// Profile Manager
const ProfileManager = window.ProfileManager = {
    // Default profile data
    profileData: {
        name: "John Doe",
        profession: "Web Developer",
        bio: "I'm a passionate web developer with over 5 years of experience in building responsive and user-friendly websites and applications.",
        email: "contact@example.com"
    },
    
    // Initialize profile functionality
    init: function() {
        // Load profile data from server
        this.fetchProfileData();
        
        // Poll for profile updates (every 30 seconds)
        this.startPolling();
        
        // Set up event listeners
        this.setupEventListeners();
    },
    
    // Start polling for profile updates
    startPolling: function() {
        this.profilePollInterval = setInterval(() => {
            this.fetchProfileData(true); // silent update (no UI refresh if unchanged)
        }, 30000); // check every 30 seconds
    },
    
    // Stop polling
    stopPolling: function() {
        if (this.profilePollInterval) {
            clearInterval(this.profilePollInterval);
        }
    },
    
    // Fetch profile data from server API
    fetchProfileData: function(silent = false) {
        fetch('/api/profile')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not OK');
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.profile) {
                    // Check if the data is different before updating
                    const isChanged = JSON.stringify(data.profile) !== JSON.stringify(this.profileData);
                    
                    if (isChanged) {
                        this.profileData = data.profile;
                        
                        // Update UI with new data
                        this.updateProfileDisplay();
                        
                        if (!silent) {
                            Toast.info('Profile updated');
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching profile data:', error);
                
                // Fall back to localStorage if server fetch fails
                this.loadFromLocalStorage();
                
                if (!silent) {
                    Toast.error('Failed to load profile from server, using local data');
                }
            });
    },
    
    // Save profile data to server
    saveProfileData: function() {
        // First save to localStorage as backup
        this.saveToLocalStorage();
        
        // Then save to server
        return fetch('/api/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ profile: this.profileData })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not OK');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log('Profile saved to server successfully');
                return true;
            } else {
                console.error('Server error saving profile:', data.message);
                return false;
            }
        })
        .catch(error => {
            console.error('Error saving profile data to server:', error);
            return false;
        });
    },
    
    // Load profile data from localStorage (fallback)
    loadFromLocalStorage: function() {
        try {
            const savedProfile = localStorage.getItem('profileData');
            if (savedProfile) {
                this.profileData = JSON.parse(savedProfile);
                this.updateProfileDisplay();
            }
        } catch (error) {
            console.error('Error loading profile data from localStorage:', error);
        }
    },
    
    // Save profile data to localStorage (backup and offline support)
    saveToLocalStorage: function() {
        try {
            localStorage.setItem('profileData', JSON.stringify(this.profileData));
            return true;
        } catch (error) {
            console.error('Error saving profile data to localStorage:', error);
            return false;
        }
    },
    
    // Update profile display with current data
    updateProfileDisplay: function() {
        // Update profile display elements
        document.getElementById('profileName').textContent = this.profileData.name;
        document.getElementById('profileProfession').textContent = this.profileData.profession;
        document.getElementById('profileBio').textContent = this.profileData.bio;
        const emailElement = document.getElementById('profileEmail');
        emailElement.textContent = this.profileData.email;
        emailElement.href = `mailto:${this.profileData.email}`;
        
        // Update social media links
        const githubLink = document.getElementById('profileGithub');
        const instagramLink = document.getElementById('profileInstagram');
        const youtubeLink = document.getElementById('profileYoutube');
        const threadsLink = document.getElementById('profileThreads');
        
        const ensureHttps = (url) => {
            if (!url) return '';
            return url.startsWith('http') ? url : `https://${url}`;
        };

        if (githubLink && this.profileData.github) {
            githubLink.href = ensureHttps(this.profileData.github);
            githubLink.style.display = 'flex';
        } else if (githubLink) {
            githubLink.style.display = 'none';
        }
        
        if (instagramLink && this.profileData.instagram) {
            instagramLink.href = ensureHttps(this.profileData.instagram);
            instagramLink.style.display = 'flex';
        } else if (instagramLink) {
            instagramLink.style.display = 'none';
        }
        
        if (youtubeLink && this.profileData.youtube) {
            youtubeLink.href = ensureHttps(this.profileData.youtube);
            youtubeLink.style.display = 'flex';
        } else if (youtubeLink) {
            youtubeLink.style.display = 'none';
        }
        
        if (threadsLink && this.profileData.threads) {
            threadsLink.href = ensureHttps(this.profileData.threads);
            threadsLink.style.display = 'flex';
        } else if (threadsLink) {
            threadsLink.style.display = 'none';
        }
    },
    
    // Open profile modal
    openProfile: function() {
        const modal = document.getElementById('profileModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },
    
    // Close profile modal
    closeProfile: function() {
        const modal = document.getElementById('profileModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    },
    
    // Show profile edit form
    showEditForm: function() {
        const profileForm = document.getElementById('profileForm');
        const editProfileBtn = document.getElementById('editProfileBtn');
        
        if (profileForm && editProfileBtn) {
            // Populate form with current data
            document.getElementById('inputName').value = this.profileData.name;
            document.getElementById('inputProfession').value = this.profileData.profession;
            document.getElementById('inputBio').value = this.profileData.bio;
            document.getElementById('inputEmail').value = this.profileData.email;
            
            // Populate social media fields
            if (document.getElementById('inputGithub')) {
                document.getElementById('inputGithub').value = this.profileData.github || '';
            }
            if (document.getElementById('inputInstagram')) {
                document.getElementById('inputInstagram').value = this.profileData.instagram || '';
            }
            if (document.getElementById('inputYoutube')) {
                document.getElementById('inputYoutube').value = this.profileData.youtube || '';
            }
            if (document.getElementById('inputThreads')) {
                document.getElementById('inputThreads').value = this.profileData.threads || '';
            }
            
            // Show form, hide edit button
            profileForm.classList.remove('hidden');
            editProfileBtn.classList.add('hidden');
        }
    },
    
    // Hide profile edit form
    hideEditForm: function() {
        const profileForm = document.getElementById('profileForm');
        const editProfileBtn = document.getElementById('editProfileBtn');
        
        if (profileForm && editProfileBtn) {
            profileForm.classList.add('hidden');
            editProfileBtn.classList.remove('hidden');
        }
    },
    
    // Save profile changes
    saveProfile: function(event) {
        event.preventDefault();
        
        // Show saving indicator or disable form if needed
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<svg class="icon"><use href="assets/icons.svg#save"></use></svg> Saving...';
        }
        
        // Get form values
        const name = document.getElementById('inputName').value;
        const profession = document.getElementById('inputProfession').value;
        const bio = document.getElementById('inputBio').value;
        const email = document.getElementById('inputEmail').value;
        const github = document.getElementById('inputGithub').value;
        const instagram = document.getElementById('inputInstagram').value;
        const youtube = document.getElementById('inputYoutube').value;
        const threads = document.getElementById('inputThreads').value;
        
        // Update profile data
        this.profileData = {
            name,
            profession,
            bio,
            email,
            github,
            instagram,
            youtube,
            threads
        };
        
        // Update display immediately for responsiveness
        this.updateProfileDisplay();
        
        // Save to server (returns a Promise)
        this.saveProfileData()
            .then(success => {
                // Hide form
                this.hideEditForm();
                
                // Show toast notification
                if (success) {
                    Toast.success('Profile updated successfully');
                } else {
                    Toast.error('Profile saved locally but failed to sync with server');
                }
            })
            .catch(error => {
                console.error('Error in save profile flow:', error);
                Toast.error('Failed to save profile');
            })
            .finally(() => {
                // Re-enable form button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<svg class="icon"><use href="assets/icons.svg#save"></use></svg> Save Profile';
                }
            });
    },
    
    // Set up event listeners
    setupEventListeners: function() {
        // Profile button click
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                this.openProfile();
            });
        }
        
        // Close profile button click
        const closeProfileBtn = document.getElementById('closeProfile');
        if (closeProfileBtn) {
            closeProfileBtn.addEventListener('click', () => {
                this.closeProfile();
            });
        }
        
        // Edit profile button click
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.showEditForm();
            });
        }
        
        // Cancel edit button click
        const cancelProfileEdit = document.getElementById('cancelProfileEdit');
        if (cancelProfileEdit) {
            cancelProfileEdit.addEventListener('click', () => {
                this.hideEditForm();
            });
        }
        
        // Profile form submit
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (event) => {
                this.saveProfile(event);
            });
        }
        
        // Close modal when clicking outside
        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            profileModal.addEventListener('click', (e) => {
                if (e.target === profileModal) {
                    this.closeProfile();
                }
            });
        }
    }
};

// Initialize all components when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Portfolio Website Initialized');
    
    // Initialize toast notification system
    Toast.init();
    
    // Initialize profile manager
    ProfileManager.init();
    
    // Initialize projects manager
    ProjectsManager.init();
    
    // Initialize admin manager
    AdminManager.init();
    
    // Set the current year in the footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Extra check for admin button functionality
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        console.log('Login button found in main.js, adding extra handler');
        loginBtn.addEventListener('click', function() {
            console.log('Login button clicked via main.js handler');
            if (typeof AdminManager !== 'undefined' && AdminManager.login) {
                AdminManager.login();
            } else {
                console.error('AdminManager or login method not available');
            }
        });
    } else {
        console.error('Login button not found in main.js');
    }
});

// Handle keyboard events
document.addEventListener('keydown', (e) => {
    // Close modals with Escape key
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.active');
        if (modals.length > 0) {
            // Close the topmost modal (last in the list)
            const topModal = modals[modals.length - 1];
            
            if (topModal.id === 'projectModal') {
                ProjectsManager.closeProjectDetails();
            } else if (topModal.id === 'settingsModal') {
                AdminManager.closeSettings();
            } else if (topModal.id === 'editProjectModal') {
                AdminManager.closeEditModal();
            } else if (topModal.id === 'profileModal') {
                ProfileManager.closeProfile();
            }
        }
    }
    
    // Gallery navigation with arrow keys when project modal is open
    if (document.getElementById('projectModal').classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
            ProjectsManager.prevImage();
        } else if (e.key === 'ArrowRight') {
            ProjectsManager.nextImage();
        }
    }
});
