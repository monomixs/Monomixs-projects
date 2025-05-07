/**
 * Projects management functionality
 * Handles loading, displaying, and navigating through projects
 */

// Projects data
let projectsData = [];

// Current project index for modal
let currentProjectIndex = 0;

// Current image index for gallery
let currentImageIndex = 0;

// Current search term
let currentSearchTerm = "";

// Projects management object
const ProjectsManager = window.ProjectsManager = {
    // Initialize the projects
    init: async function() {
        // Load projects from server or localStorage
        await this.loadProjects();
        
        // Render the projects
        this.renderProjects();

        // Add event listeners
        this.setupEventListeners();
        
        // Set up polling for project updates (every 30 seconds)
        setInterval(async () => {
            await this.loadProjects();
            this.renderProjects();
        }, 30000);
    },

    // Load projects from server or localStorage
    loadProjects: async function() {
        let loadedFromServer = false;
        
        try {
            // Try to load from server first
            const response = await fetch('/api/projects');
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && Array.isArray(data.projects)) {
                    projectsData = data.projects;
                    console.log('Projects loaded successfully from server');
                    loadedFromServer = true;
                    
                    // Update localStorage with server data to keep them in sync
                    localStorage.setItem('projects', JSON.stringify(projectsData));
                } else {
                    console.warn('Server returned invalid project data format');
                }
            } else {
                console.warn('Server returned error status when loading projects');
            }
        } catch (error) {
            console.warn('Failed to load projects from server, falling back to localStorage', error);
        }
        
        // Fall back to localStorage if server fetch fails
        if (!loadedFromServer) {
            const savedProjects = localStorage.getItem('projects');
            
            if (savedProjects) {
                try {
                    projectsData = JSON.parse(savedProjects);
                    console.log('Projects loaded from localStorage (server unavailable)');
                    Toast.info('Using locally stored projects. Changes may not be saved to the server.');
                } catch (e) {
                    console.error('Error parsing projects from localStorage', e);
                    projectsData = [];
                }
            } else {
                // Initialize with empty array if no saved projects
                projectsData = [];
                console.log('No projects found in localStorage, starting with empty project list');
            }
            
            // Try to save to server in case we're starting with localStorage data
            this.saveProjects();
        }
    },

    // Save projects to server and localStorage
    saveProjects: async function() {
        // Always save to localStorage as backup
        localStorage.setItem('projects', JSON.stringify(projectsData));
        
        // Try to save to server
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ projects: projectsData })
            });
            
            if (!response.ok) {
                console.warn('Failed to save projects to server');
                Toast.error('Unable to save projects to server. Changes saved locally only.');
            } else {
                console.log('Projects successfully saved to server');
                // Only show success notification if explicitly requested
                // Toast.success('Projects saved successfully to the server');
            }
        } catch (error) {
            console.error('Error saving projects to server:', error);
            Toast.error('Network error: Unable to save to server. Changes saved locally only.');
        }
    },

    // Render projects in the grid
    renderProjects: function() {
        const projectsGrid = document.getElementById('projectsGrid');
        
        // Clear existing content
        projectsGrid.innerHTML = '';
        
        if (projectsData.length === 0) {
            projectsGrid.innerHTML = '<div class="loading-message">No projects found. Add your first project!</div>';
            return;
        }
        
        // Filter projects based on search term if one exists
        let filteredProjects = projectsData;
        if (currentSearchTerm.trim() !== '') {
            const searchTerm = currentSearchTerm.toLowerCase().trim();
            filteredProjects = projectsData.filter(project => {
                // Search in title, description, and preview description
                const title = (project.title || '').toLowerCase();
                const description = (project.description || '').toLowerCase();
                const previewDesc = (project.previewDescription || '').toLowerCase();
                
                return title.includes(searchTerm) || 
                       description.includes(searchTerm) || 
                       previewDesc.includes(searchTerm);
            });
            
            // Show a message when no results found
            if (filteredProjects.length === 0) {
                projectsGrid.innerHTML = `<div class="loading-message">No projects found matching "${currentSearchTerm}"</div>`;
                return;
            }
        }
        
        // Create a card for each project
        filteredProjects.forEach((project, i) => {
            // Find the actual index in the original array for opening the correct project
            const index = projectsData.findIndex(p => p === project);
            
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            projectCard.dataset.index = index;
            
            const thumbnailImage = project.images && project.images.length > 0 ? 
                project.images[0] : '';
            
            // Use previewDescription if available, otherwise fall back to description
            const previewText = project.previewDescription || project.description;
            
            projectCard.innerHTML = `
                <img src="${thumbnailImage}" alt="${project.title}" class="project-image" 
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\'%3E%3Crect width=\\'100\\' height=\\'100\\' fill=\\'%23cccccc\\' /%3E%3Ctext x=\\'50\\' y=\\'50\\' font-size=\\'10\\' text-anchor=\\'middle\\' alignment-baseline=\\'middle\\' font-family=\\'sans-serif\\' fill=\\'%23666666\\'%3ENo Image%3C/text%3E%3C/svg%3E'">
                <div class="project-content">
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-description">${previewText}</p>
                </div>
            `;
            
            // Add click event to open project details
            projectCard.addEventListener('click', () => {
                this.openProjectDetails(index);
            });
            
            projectsGrid.appendChild(projectCard);
        });
    },

    // Open project details modal
    openProjectDetails: function(index) {
        currentProjectIndex = index;
        currentImageIndex = 0;
        const project = projectsData[index];
        
        // Set modal content
        document.getElementById('modalTitle').textContent = project.title;
        document.getElementById('modalDescription').textContent = project.description;
        
        // Set up the gallery
        this.setupGallery(project.images || []);
        
        // Set up project files for download
        this.setupProjectFiles(project.files || []);
        
        // Show or hide edit button based on admin status
        const editBtn = document.getElementById('editProject');
        if (AdminManager.isAdmin()) {
            editBtn.classList.remove('hidden');
            editBtn.onclick = () => AdminManager.openEditProjectModal(index);
        } else {
            editBtn.classList.add('hidden');
        }
        
        // Show the modal
        const modal = document.getElementById('projectModal');
        modal.classList.add('active');
        
        // Prevent scrolling on the body
        document.body.style.overflow = 'hidden';
    },
    
    // Set up project files for download
    setupProjectFiles: function(files) {
        const downloadAllBtn = document.getElementById('downloadAllFiles');
        
        // Set up the Download All Files button
        if (downloadAllBtn) {
            if (!Array.isArray(files) || files.length === 0) {
                downloadAllBtn.disabled = true;
                downloadAllBtn.classList.add('disabled');
            } else {
                downloadAllBtn.disabled = false;
                downloadAllBtn.classList.remove('disabled');
                downloadAllBtn.onclick = () => this.downloadAllProjectFiles(files);
            }
        }
    },
    
    // Get original filename without timestamp
    getOriginalFileName: function(path) {
        const fileName = path.split('/').pop();
        
        // Try to extract the original filename by removing the timestamp part
        const match = fileName.match(/^(.+?)_\d+(\..+)$/);
        if (match) {
            return match[1] + match[2]; // Combine name and extension without timestamp
        }
        
        return fileName;
    },
    
    // Download all files in a project as a batch
    downloadAllProjectFiles: function(files) {
        if (!Array.isArray(files) || files.length === 0) {
            Toast.error('No files available to download');
            return;
        }
        
        // Process each file with a slight delay to prevent browser blocking
        files.forEach((file, index) => {
            setTimeout(() => {
                const filePath = typeof file === 'string' ? file : file.path;
                const fileName = typeof file === 'string' ? this.getOriginalFileName(filePath) : (file.name || this.getOriginalFileName(filePath));
                
                // Create a temporary link to trigger download
                const link = document.createElement('a');
                link.href = filePath;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Show success message after all downloads started
                if (index === files.length - 1) {
                    Toast.success(`Started downloading ${files.length} files`);
                }
            }, index * 300); // 300ms delay between each download
        });
    },

    // Close project details modal
    closeProjectDetails: function() {
        const modal = document.getElementById('projectModal');
        modal.classList.remove('active');
        
        // Re-enable scrolling on the body
        document.body.style.overflow = '';
    },

    // Set up image gallery for project details
    setupGallery: function(images) {
        const galleryContainer = document.getElementById('galleryImages');
        const indicators = document.getElementById('galleryIndicators');
        
        galleryContainer.innerHTML = '';
        indicators.innerHTML = '';
        
        if (images.length === 0) {
            // If no images, show a placeholder
            galleryContainer.innerHTML = `
                <div class="gallery-image active" style="display:flex; align-items:center; justify-content:center; background-color:#f0f0f0; color:#666;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                </div>
            `;
            
            // Hide navigation buttons
            document.getElementById('prevImage').style.display = 'none';
            document.getElementById('nextImage').style.display = 'none';
            return;
        }
        
        // Show navigation buttons if more than one image
        document.getElementById('prevImage').style.display = images.length > 1 ? 'flex' : 'none';
        document.getElementById('nextImage').style.display = images.length > 1 ? 'flex' : 'none';
        
        // Create gallery images
        images.forEach((src, i) => {
            const img = document.createElement('img');
            img.className = `gallery-image ${i === 0 ? 'active' : ''}`;
            img.src = src;
            img.alt = `Project image ${i + 1}`;
            galleryContainer.appendChild(img);
            
            // Create indicator
            const indicator = document.createElement('button');
            indicator.className = `gallery-indicator ${i === 0 ? 'active' : ''}`;
            indicator.setAttribute('data-index', i);
            indicator.addEventListener('click', () => this.changeImage(i));
            indicators.appendChild(indicator);
        });
    },

    // Navigate to previous image in gallery
    prevImage: function() {
        const images = projectsData[currentProjectIndex].images || [];
        if (images.length <= 1) return;
        
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        this.updateGallery();
    },

    // Navigate to next image in gallery
    nextImage: function() {
        const images = projectsData[currentProjectIndex].images || [];
        if (images.length <= 1) return;
        
        currentImageIndex = (currentImageIndex + 1) % images.length;
        this.updateGallery();
    },

    // Change to specific image in gallery
    changeImage: function(index) {
        const images = projectsData[currentProjectIndex].images || [];
        if (index >= 0 && index < images.length) {
            currentImageIndex = index;
            this.updateGallery();
        }
    },

    // Update gallery to show current image
    updateGallery: function() {
        const galleryImages = document.querySelectorAll('.gallery-image');
        const indicators = document.querySelectorAll('.gallery-indicator');
        
        // Update images
        galleryImages.forEach((img, i) => {
            if (i === currentImageIndex) {
                img.classList.add('active');
            } else {
                img.classList.remove('active');
            }
        });
        
        // Update indicators
        indicators.forEach((indicator, i) => {
            if (i === currentImageIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    },

    // Add a new project at the top of the list
    addProject: function(project) {
        // Add timestamp to the project
        project.timestamp = new Date().toISOString();
        
        // Add to the beginning of the array
        projectsData.unshift(project);
        this.saveProjects();
        this.renderProjects();
    },

    // Update an existing project
    updateProject: function(index, updatedProject) {
        if (index >= 0 && index < projectsData.length) {
            projectsData[index] = updatedProject;
            this.saveProjects();
            this.renderProjects();
        }
    },

    // Delete a project
    deleteProject: function(index) {
        if (index >= 0 && index < projectsData.length) {
            projectsData.splice(index, 1);
            this.saveProjects();
            this.renderProjects();
        }
    },

    // Search projects functionality
    searchProjects: function(searchTerm) {
        currentSearchTerm = searchTerm;
        this.renderProjects();
    },
    
    // Clear search and reset view
    clearSearch: function() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        currentSearchTerm = '';
        this.renderProjects();
    },
    
    // Set up event listeners for project navigation
    setupEventListeners: function() {
        // Function to add event listeners that ensures elements exist
        const addListeners = () => {
            // Project modal close button
            const closeModal = document.getElementById('closeModal');
            if (closeModal) {
                closeModal.addEventListener('click', () => {
                    this.closeProjectDetails();
                });
            }
            
            // Search input functionality
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                // Perform search on input with small delay for better performance
                let searchTimeout;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        this.searchProjects(e.target.value);
                    }, 300);
                });
                
                // Handle Enter key press
                searchInput.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') {
                        this.searchProjects(e.target.value);
                    }
                });
            }
            
            // Clear search button
            const clearSearchBtn = document.getElementById('clearSearch');
            if (clearSearchBtn) {
                clearSearchBtn.addEventListener('click', () => {
                    this.clearSearch();
                });
            }
            
            // Gallery navigation buttons
            const prevImage = document.getElementById('prevImage');
            if (prevImage) {
                prevImage.addEventListener('click', () => {
                    this.prevImage();
                });
            }
            
            const nextImage = document.getElementById('nextImage');
            if (nextImage) {
                nextImage.addEventListener('click', () => {
                    this.nextImage();
                });
            }
            
            // Close modal when clicking outside the content
            const projectModal = document.getElementById('projectModal');
            if (projectModal) {
                projectModal.addEventListener('click', (e) => {
                    if (e.target === projectModal) {
                        this.closeProjectDetails();
                    }
                });
            }
        };
        
        // Try to add event listeners immediately
        addListeners();
        
        // Also add them on DOMContentLoaded as a fallback
        document.addEventListener('DOMContentLoaded', () => {
            addListeners();
        });
    }
};
