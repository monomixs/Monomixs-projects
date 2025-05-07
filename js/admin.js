/**
 * Admin functionality
 * Handles authentication and project management
 */

// Admin credentials (hardcoded for this project)
const ADMIN_PASSWORD = "SoloLvl!ng_P@ss123";

// Admin management object
const AdminManager = window.AdminManager = {
    // Track admin login status
    adminLoggedIn: false,

    // Initialize admin functionality
    init: function() {
        console.log('Initializing AdminManager');
        
        // Check if admin was previously logged in
        this.checkAdminStatus();
        
        // Set up event listeners for admin UI
        this.setupEventListeners();
        
        // Explicitly bind login click handler to ensure it works
        setTimeout(() => {
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                console.log('Adding login button click handler via setTimeout');
                loginBtn.addEventListener('click', () => {
                    this.login();
                });
            }
        }, 500);
    },

    // Check if admin is already logged in (from localStorage)
    checkAdminStatus: function() {
        const adminToken = localStorage.getItem('adminToken');
        
        // Simple check - in a real application, you would validate the token properly
        if (adminToken === 'admin_logged_in') {
            this.setAdminLoggedIn(true);
        }
    },

    // Set admin login status
    setAdminLoggedIn: function(status) {
        this.adminLoggedIn = status;
        console.log('Setting admin logged in status to:', status);
        
        try {
            if (status) {
                // Store admin status in localStorage
                localStorage.setItem('adminToken', 'admin_logged_in');
                
                // Update UI to show admin controls
                const adminLoginForm = document.getElementById('adminLoginForm');
                const adminControls = document.getElementById('adminControls');
                
                if (adminLoginForm) {
                    adminLoginForm.classList.add('hidden');
                } else {
                    console.error('Admin login form element not found');
                }
                
                if (adminControls) {
                    adminControls.classList.remove('hidden');
                } else {
                    console.error('Admin controls element not found');
                }
                
                // Show admin-only elements
                document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
            } else {
                // Remove admin status from localStorage
                localStorage.removeItem('adminToken');
                
                // Update UI to hide admin controls
                const adminLoginForm = document.getElementById('adminLoginForm');
                const adminControls = document.getElementById('adminControls');
                
                if (adminLoginForm) {
                    adminLoginForm.classList.remove('hidden');
                }
                
                if (adminControls) {
                    adminControls.classList.add('hidden');
                }
                
                // Hide admin-only elements
                document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
            }
        } catch (error) {
            console.error('Error updating admin UI:', error);
        }
    },

    // Check if user is admin
    isAdmin: function() {
        return this.adminLoggedIn;
    },

    // Attempt admin login
    login: function() {
        const passwordInput = document.getElementById('adminPassword');
        if (!passwordInput) {
            console.error('Admin password input not found');
            return;
        }
        
        const password = passwordInput.value;
        console.log('Attempting login with password:', password);
        
        if (password === ADMIN_PASSWORD) {
            console.log('Login successful');
            this.setAdminLoggedIn(true);
            passwordInput.value = '';
            // Show success notification
            Toast.success('Login successful');
        } else {
            console.log('Login failed - incorrect password');
            // Always use toast notification
            Toast.error('Incorrect password');
        }
    },

    // Log out admin
    logout: function() {
        this.setAdminLoggedIn(false);
    },

    // Open settings modal
    openSettings: function() {
        const modal = document.getElementById('settingsModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    // Close settings modal
    closeSettings: function() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    // Open edit project modal for new project
    openAddProjectModal: function() {
        // Clear form fields
        const form = document.getElementById('projectForm');
        if (form) {
            form.reset();
            // Remove all image and file input elements
            const imagesList = document.getElementById('imagesList');
            const projectFilesList = document.getElementById('projectFilesList');
            
            if (imagesList) {
                imagesList.innerHTML = '';
                // Ensure any global variables are also cleared
                window.imagesList = [];
            }
            
            if (projectFilesList) {
                projectFilesList.innerHTML = '';
                // Ensure any global variables are also cleared
                window.projectFiles = [];
            }
        }
        
        document.getElementById('editModalTitle').textContent = 'Add New Project';
        
        // Hide delete button for new projects
        const deleteProjectBtn = document.getElementById('deleteProjectBtn');
        if (deleteProjectBtn) {
            deleteProjectBtn.classList.add('hidden');
        }
        
        // Store new project flag
        const projectForm = document.getElementById('projectForm');
        if (projectForm) {
            projectForm.dataset.newProject = 'true';
        }
        
        // Show the modal
        const modal = document.getElementById('editProjectModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    // Open edit project modal for existing project
    openEditProjectModal: function(index) {
        const project = projectsData[index];
        
        // Set form title
        document.getElementById('editModalTitle').textContent = 'Edit Project';
        
        // Populate form fields
        document.getElementById('projectTitle').value = project.title;
        document.getElementById('projectPreviewDescription').value = project.previewDescription || '';
        document.getElementById('projectDescription').value = project.description;
        
        // Clear existing image fields
        const imagesList = document.getElementById('imagesList');
        if (imagesList) {
            imagesList.innerHTML = '';
            // Reset global variables to prevent carryover
            window.imagesList = [];
        }
        
        // Add image fields for existing images
        if (project.images && project.images.length > 0) {
            project.images.forEach(imagePath => {
                // For compatibility with old format
                const imageName = typeof imagePath === 'string' ? imagePath.split('/').pop() : '';
                addImageField(imagePath, imageName);
            });
        }
        
        // Clear existing project files
        const projectFilesList = document.getElementById('projectFilesList');
        if (projectFilesList) {
            projectFilesList.innerHTML = '';
            // Reset global variables to prevent carryover
            window.projectFiles = [];
        }
        
        // Add project files for existing projects
        if (project.files && project.files.length > 0) {
            // New format (array of file objects)
            project.files.forEach(file => {
                const filePath = typeof file === 'string' ? file : file.path;
                const fileName = typeof file === 'string' ? filePath.split('/').pop() : (file.name || filePath.split('/').pop());
                addProjectFileField(filePath, fileName);
            });
        } else if (project.file) {
            // Old format (single file string)
            const filePath = project.file;
            const fileName = filePath.split('/').pop();
            addProjectFileField(filePath, fileName);
        }
        
        // Show delete button for existing projects
        document.getElementById('deleteProjectBtn').classList.remove('hidden');
        
        // Store project index for update
        document.getElementById('projectForm').dataset.projectIndex = index;
        document.getElementById('projectForm').dataset.newProject = 'false';
        
        // Show the modal
        const modal = document.getElementById('editProjectModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    // Close edit project modal
    closeEditModal: function() {
        const modal = document.getElementById('editProjectModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    // Add an image field to the form
    addImageField: function(path = '', name = '') {
        const imagesList = document.getElementById('imagesList');
        if (!imagesList) return;
        
        const inputGroup = document.createElement('div');
        inputGroup.className = 'image-input-group';
        
        // Create a preview if path exists
        let preview = '';
        if (path) {
            preview = `<div class="image-preview"><img src="${path}" alt="${name || 'Preview'}"></div>`;
        }
        
        inputGroup.innerHTML = `
            ${preview}
            <div class="image-details">
                <div class="image-name">${name}</div>
                <div class="image-path">${path}</div>
            </div>
            <input type="hidden" class="image-path-input" value="${path}">
            <button type="button" class="btn secondary-btn remove-image-btn">
                <svg class="icon">
                    <use href="assets/icons.svg#trash"></use>
                </svg>
            </button>
        `;
        
        // Add remove button functionality
        const removeBtn = inputGroup.querySelector('.remove-image-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                inputGroup.remove();
            });
        }
        
        imagesList.appendChild(inputGroup);
    },
    
    // Add a project file field to the form
    addProjectFileField: function(path = '', name = '') {
        const projectFilesList = document.getElementById('projectFilesList');
        if (!projectFilesList) return;
        
        const fileGroup = document.createElement('div');
        fileGroup.className = 'project-file-group';
        
        fileGroup.innerHTML = `
            <div class="file-info">
                <div class="file-name">${name || path.split('/').pop()}</div>
                <div class="file-path">${path}</div>
            </div>
            <input type="hidden" class="project-file-path-input" value="${path}">
            <button type="button" class="btn secondary-btn remove-file-btn">
                <svg class="icon">
                    <use href="assets/icons.svg#trash"></use>
                </svg>
            </button>
        `;
        
        // Add remove button functionality
        const removeBtn = fileGroup.querySelector('.remove-file-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                fileGroup.remove();
            });
        }
        
        projectFilesList.appendChild(fileGroup);
    },

    // Save project from form data
    saveProject: function(event) {
        event.preventDefault();
        
        // Get form data
        const form = document.getElementById('projectForm');
        const title = document.getElementById('projectTitle').value;
        const previewDescription = document.getElementById('projectPreviewDescription').value;
        const description = document.getElementById('projectDescription').value;
        
        // Get image paths
        const imageInputs = form.querySelectorAll('.image-path-input');
        const images = [];
        
        imageInputs.forEach(input => {
            if (input.value.trim()) {
                images.push(input.value.trim());
            }
        });
        
        // Get project file paths
        const fileInputs = form.querySelectorAll('.project-file-path-input');
        const files = [];
        
        fileInputs.forEach(input => {
            if (input.value.trim()) {
                files.push({
                    path: input.value.trim(),
                    name: input.closest('.project-file-group').querySelector('.file-name').textContent
                });
            }
        });
        
        // Create project object
        const project = {
            title,
            previewDescription,
            description,
            images,
            files
        };
        
        // Check if adding new or updating existing
        const isNewProject = form.dataset.newProject === 'true';
        
        if (isNewProject) {
            // Add new project
            ProjectsManager.addProject(project);
            
            // Show success notification
            if (window.Toast) {
                Toast.success('New project added successfully');
            }
        } else {
            // Update existing project
            const index = parseInt(form.dataset.projectIndex);
            ProjectsManager.updateProject(index, project);
            
            // Show success notification
            if (window.Toast) {
                Toast.success('Project updated successfully');
            }
        }
        
        // Close the modal
        this.closeEditModal();
    },

    // Delete current project
    deleteProject: function() {
        // We'll keep the confirm dialog for delete confirmation as it requires user input
        if (confirm('Are you sure you want to delete this project?')) {
            const form = document.getElementById('projectForm');
            const index = parseInt(form.dataset.projectIndex);
            
            ProjectsManager.deleteProject(index);
            this.closeEditModal();
            
            // Show success notification
            if (window.Toast) {
                Toast.success('Project deleted successfully');
            }
        }
    },

    // Set up event listeners for admin functionality
    setupEventListeners: function() {
        // We'll use a function to add event listeners that ensures elements exist
        const addListeners = () => {
            // Settings button
            const settingsBtn = document.getElementById('settingsBtn');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    this.openSettings();
                });
            }
            
            // Close settings button
            const closeSettingsBtn = document.getElementById('closeSettings');
            if (closeSettingsBtn) {
                closeSettingsBtn.addEventListener('click', () => {
                    this.closeSettings();
                });
            }
            
            // Login button
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    this.login();
                });
                console.log('Login button event listener added');
            } else {
                console.error('Login button not found');
            }
            
            // Admin password enter key
            const adminPassword = document.getElementById('adminPassword');
            if (adminPassword) {
                adminPassword.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') {
                        this.login();
                    }
                });
            }
        };
        
        // Try to add event listeners immediately
        addListeners();
        
        // Also add them on DOMContentLoaded as a fallback
        document.addEventListener('DOMContentLoaded', () => {
            // Run the same listener function again to catch any missed elements
            addListeners();
            
            // Login button
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    this.login();
                });
            }
            
            // Admin password enter key
            const adminPassword = document.getElementById('adminPassword');
            if (adminPassword) {
                adminPassword.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') {
                        this.login();
                    }
                });
            }
            
            // Logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    this.logout();
                });
            }
            
            // Add project button
            const addProjectBtn = document.getElementById('addProjectBtn');
            if (addProjectBtn) {
                addProjectBtn.addEventListener('click', () => {
                    this.openAddProjectModal();
                });
            }
            
            // Close edit modal button
            const closeEditModal = document.getElementById('closeEditModal');
            if (closeEditModal) {
                closeEditModal.addEventListener('click', () => {
                    this.closeEditModal();
                });
            }
            
            // Add image button
            const addImageBtn = document.getElementById('addImageBtn');
            if (addImageBtn) {
                addImageBtn.addEventListener('click', () => {
                    this.addImageField();
                });
            }
            
            // Save project form
            const projectForm = document.getElementById('projectForm');
            if (projectForm) {
                projectForm.addEventListener('submit', (e) => {
                    this.saveProject(e);
                });
            }
            
            // Delete project button
            const deleteProjectBtn = document.getElementById('deleteProjectBtn');
            if (deleteProjectBtn) {
                deleteProjectBtn.addEventListener('click', () => {
                    this.deleteProject();
                });
            }
            
            // Close modals when clicking outside content
            const settingsModal = document.getElementById('settingsModal');
            if (settingsModal) {
                settingsModal.addEventListener('click', (e) => {
                    if (e.target === settingsModal) {
                        this.closeSettings();
                    }
                });
            }
            
            const editProjectModal = document.getElementById('editProjectModal');
            if (editProjectModal) {
                editProjectModal.addEventListener('click', (e) => {
                    if (e.target === editProjectModal) {
                        this.closeEditModal();
                    }
                });
            }
        });
    }
};
