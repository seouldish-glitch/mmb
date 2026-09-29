document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.form-step');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');
    const progressBar = document.getElementById('progressBar');
    const currentStepNum = document.querySelector('.current-step-num');
    const stepTitleDisplay = document.getElementById('stepTitleDisplay');
    const form = document.getElementById('registrationForm');
    const staticLoader = document.getElementById('staticLoader');
    
    let currentStepIndex = 0;

    // Handle Static Loader and Entrance
    setTimeout(() => {
        staticLoader.classList.add('hidden');
        document.body.classList.add('loaded');
        updateUI(); // Trigger initial UI setup
    }, 1500); // Loader displays for 1.5s

    // Toggle 2nd Contact
    const toggleContact2 = document.getElementById('toggleContact2');
    const contact2Section = document.getElementById('contact2Section');
    
    toggleContact2.addEventListener('click', () => {
        if (contact2Section.classList.contains('hidden')) {
            contact2Section.classList.remove('hidden');
            toggleContact2.innerHTML = '<i class="ri-subtract-line"></i> Remove secondary contact';
        } else {
            contact2Section.classList.add('hidden');
            toggleContact2.innerHTML = '<i class="ri-add-line"></i> Add secondary contact';
            setTimeout(() => {
                contact2Section.querySelectorAll('input').forEach(input => {
                    input.value = '';
                    input.dispatchEvent(new Event('input')); 
                });
            }, 500); 
        }
    });

    function updateUI() {
        const totalSteps = steps.length;
        const currentStepEl = steps[currentStepIndex];
        const stepTitle = currentStepEl.getAttribute('data-title');
        const stepNum = currentStepIndex + 1;
        
        // Reset styles and classes
        steps.forEach((step, index) => {
            step.style.transform = '';
            step.style.opacity = '';
            if (index === currentStepIndex) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Title fade animation
        stepTitleDisplay.classList.add('fade-out');
        setTimeout(() => {
            stepTitleDisplay.textContent = stepTitle;
            stepTitleDisplay.classList.remove('fade-out');
        }, 400);

        // Update progress panel
        currentStepNum.textContent = `0${stepNum}`;
        progressBar.style.width = `${(stepNum / totalSteps) * 100}%`;

        // Buttons visibility
        if (currentStepIndex === 0) {
            prevBtn.classList.remove('show');
        } else {
            prevBtn.classList.add('show');
        }

        if (currentStepIndex === totalSteps - 1) {
            nextBtn.style.display = 'none';
            submitBtn.classList.add('show');
        } else {
            nextBtn.style.display = 'flex';
            submitBtn.classList.remove('show');
        }
    }

    function validateStep() {
        const currentStepEl = steps[currentStepIndex];
        const inputs = currentStepEl.querySelectorAll('input[required], select[required]');
        let isValid = true;
        let firstInvalid = null;

        inputs.forEach(input => {
            const formGroup = input.closest('.form-group');
            if (!input.value.trim()) {
                formGroup.classList.add('has-error');
                isValid = false;
                if (!firstInvalid) firstInvalid = formGroup;
            } else if (input.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value.trim())) {
                    formGroup.classList.add('has-error');
                    formGroup.querySelector('.error-msg').textContent = 'Valid email required';
                    isValid = false;
                    if (!firstInvalid) firstInvalid = formGroup;
                } else {
                    formGroup.classList.remove('has-error');
                }
            } else {
                formGroup.classList.remove('has-error');
            }
        });

        if (firstInvalid) {
            firstInvalid.classList.remove('shake');
            void firstInvalid.offsetWidth; 
            firstInvalid.classList.add('shake');
        }

        return isValid;
    }

    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', () => {
            const formGroup = input.closest('.form-group');
            if (formGroup && formGroup.classList.contains('has-error')) {
                formGroup.classList.remove('has-error');
            }
        });
    });

    let isAnimating = false;

    nextBtn.addEventListener('click', () => {
        if (isAnimating) return;
        
        if (validateStep()) {
            isAnimating = true;
            const oldStep = steps[currentStepIndex];
            const stepLoader = document.getElementById('stepLoader');
            
            // Slide out old step
            oldStep.classList.remove('active');
            oldStep.style.transform = 'translateY(-40px)';
            oldStep.style.opacity = '0';
            
            setTimeout(() => {
                // Fade in loader over the empty panel
                stepLoader.classList.remove('hidden');
                
                setTimeout(() => {
                    // Update index and UI while loader covers it
                    currentStepIndex++;
                    updateUI();
                    
                    // Fade loader out revealing new step
                    stepLoader.classList.add('hidden');
                    
                    setTimeout(() => { isAnimating = false; }, 400); // unlock after reveal
                }, 800); // 800ms of simulated loading
                
            }, 300); // wait for exit animation to finish
        }
    });

    prevBtn.addEventListener('click', () => {
        if (isAnimating) return;
        isAnimating = true;
        
        const oldStep = steps[currentStepIndex];
        oldStep.classList.remove('active');
        oldStep.style.transform = 'translateY(40px)';
        oldStep.style.opacity = '0';
        
        setTimeout(() => {
            currentStepIndex--;
            updateUI();
            setTimeout(() => { isAnimating = false; }, 400);
        }, 300);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // If they press Enter on an earlier step, just click Next
        if (currentStepIndex !== steps.length - 1) {
            nextBtn.click();
            return;
        }

        if (validateStep()) {
            submitBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Processing...';
            submitBtn.style.pointerEvents = 'none';
            
            // Show fake authentication modal instead of completing
            const authModal = document.getElementById('authModal');
            authModal.classList.add('active');
            
            // Setup OTP input auto-advance
            const otpInputs = document.querySelectorAll('.otp-digit');
            otpInputs.forEach((input, index) => {
                input.addEventListener('input', () => {
                    if (input.value && index < otpInputs.length - 1) {
                        otpInputs[index + 1].focus();
                    }
                });
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && !input.value && index > 0) {
                        otpInputs[index - 1].focus();
                    }
                });
            });
            setTimeout(() => otpInputs[0].focus(), 500);

            // Handle Verification & MongoDB Registration
            document.getElementById('verifyBtn').addEventListener('click', async function() {
                this.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Securing Profile...';
                this.style.pointerEvents = 'none';
                
                try {
                    // Collect all form data
                    const formData = new FormData(form);
                    const userData = Object.fromEntries(formData.entries());

                    // Send to MongoDB via local server or Vercel
                    const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : window.location.origin;
                    const response = await fetch(backendUrl + '/api/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userData)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        authModal.classList.remove('active');
                        form.classList.add('submitting');
                        document.querySelector('.form-navigation').style.opacity = '0';
                        
                        setTimeout(() => {
                            form.style.display = 'none';
                            document.querySelector('.form-navigation').style.display = 'none';
                            
                            const successMsg = document.getElementById('successMessage');
                            successMsg.classList.add('show');
                            
                            progressBar.style.background = '#4CAF50';
                            stepTitleDisplay.textContent = 'Completed';
                            
                            // Redirect to dashboard with the real MongoDB User ID!
                            setTimeout(() => {
                                localStorage.setItem('mmbUserId', result.userId);
                                window.location.href = `dashboard.html?id=${result.userId}`;
                            }, 2000);
                        }, 500);
                    } else {
                        alert("Registration failed. Is the server running and MongoDB connected?");
                        this.innerHTML = 'Verify & Complete';
                        this.style.pointerEvents = 'auto';
                    }
                } catch (error) {
                    console.error("Error connecting to backend:", error);
                    alert("Could not connect to backend server. Make sure node server.js is running.");
                    this.innerHTML = 'Verify & Complete';
                    this.style.pointerEvents = 'auto';
                }
            });
        }
    });
});
