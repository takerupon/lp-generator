document.addEventListener("DOMContentLoaded", function() {
    // ナビゲーションのスクロールアニメーション
    document.querySelectorAll('nav a, .footer-links a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            const headerHeight = document.querySelector('header').offsetHeight;
            
            window.scrollTo({
                top: targetElement.offsetTop - headerHeight,
                behavior: 'smooth'
            });
        });
    });
    
    // ヘッダースクロール効果
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (window.scrollY > 100) {
            header.style.padding = "10px 0";
            header.style.boxShadow = "0 5px 15px rgba(0,0,0,0.1)";
        } else {
            header.style.padding = "20px 0";
            header.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
        }
    });
    
    // 統計数値のアニメーション
    const stats = document.querySelectorAll('.stat .number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateValue(entry.target, 0, parseInt(entry.target.textContent), 1500);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    stats.forEach(stat => {
        const originalValue = stat.textContent;
        stat.textContent = '0';
        observer.observe(stat);
    });
    
    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            let value = Math.floor(progress * (end - start) + start);
            
            if (element.textContent.includes('+')) {
                element.textContent = value + '+';
            } else if (element.textContent.includes('%')) {
                element.textContent = value + '%';
            } else {
                element.textContent = value;
            }
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
    
    // フェードインアニメーション
    const fadeElements = document.querySelectorAll('.feature-card, .testimonial, .teacher');
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    fadeElements.forEach(element => {
        element.style.opacity = 0;
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        fadeObserver.observe(element);
    });
    
    // フォームバリデーション
    const contactForm = document.querySelector('.contact-form');
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');
        const level = document.getElementById('level');
        let isValid = true;
        
        // 簡易バリデーション
        if (name.value.trim() === '') {
            showError(name, 'お名前を入力してください');
            isValid = false;
        } else {
            removeError(name);
        }
        
        if (email.value.trim() === '') {
            showError(email, 'メールアドレスを入力してください');
            isValid = false;
        } else if (!isValidEmail(email.value)) {
            showError(email, '有効なメールアドレスを入力してください');
            isValid = false;
        } else {
            removeError(email);
        }
        
        if (phone.value.trim() === '') {
            showError(phone, '電話番号を入力してください');
            isValid = false;
        } else {
            removeError(phone);
        }
        
        if (level.value === '') {
            showError(level, '英語レベルを選択してください');
            isValid = false;
        } else {
            removeError(level);
        }
        
        if (isValid) {
            // フォーム送信成功時のアニメーション
            contactForm.innerHTML = `
                <div class="success-message" style="text-align: center; padding: 40px 0;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <h3 style="margin-top: 20px; color: white;">お申し込みありがとうございます！</h3>
                    <p style="margin-top: 10px;">確認メールをお送りしましたので、ご確認ください。</p>
                </div>
            `;
        }
    });
    
    function showError(input, message) {
        const formGroup = input.parentElement;
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.color = '#ff5252';
        errorElement.style.fontSize = '0.85rem';
        errorElement.style.marginTop = '5px';
        errorElement.innerText = message;
        
        // エラーメッセージが既に存在する場合は追加しない
        if (!formGroup.querySelector('.error-message')) {
            formGroup.appendChild(errorElement);
        }
        
        input.style.borderColor = '#ff5252';
        input.style.backgroundColor = 'rgba(255, 82, 82, 0.1)';
    }
    
    function removeError(input) {
        const formGroup = input.parentElement;
        const errorElement = formGroup.querySelector('.error-message');
        
        if (errorElement) {
            formGroup.removeChild(errorElement);
        }
        
        input.style.borderColor = '';
        input.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    }
    
    function isValidEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    
    // モバイル用のナビゲーションメニュートグル
    const createMobileMenu = () => {
        const header = document.querySelector('header');
        const logo = document.querySelector('.logo');
        const nav = document.querySelector('nav');
        
        const mobileMenuButton = document.createElement('div');
        mobileMenuButton.className = 'mobile-menu-button';
        mobileMenuButton.innerHTML = '<span></span><span></span><span></span>';
        mobileMenuButton.style.display = 'none';
        mobileMenuButton.style.flexDirection = 'column';
        mobileMenuButton.style.justifyContent = 'space-between';
        mobileMenuButton.style.width = '30px';
        mobileMenuButton.style.height = '22px';
        mobileMenuButton.style.cursor = 'pointer';
        
        mobileMenuButton.querySelectorAll('span').forEach(span => {
            span.style.height = '3px';
            span.style.width = '100%';
            span.style.backgroundColor = '#3d5afe';
            span.style.borderRadius = '3px';
            span.style.transition = 'all 0.3s ease';
        });
        
        header.querySelector('.container').insertBefore(mobileMenuButton, nav);
        
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                mobileMenuButton.style.display = 'flex';
                nav.style.display = 'none';
                nav.style.position = 'absolute';
                nav.style.top = '100%';
                nav.style.left = '0';
                nav.style.width = '100%';
                nav.style.backgroundColor = '#fff';
                nav.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                nav.style.padding = '20px';
                nav.style.zIndex = '999';
            } else {
                mobileMenuButton.style.display = 'none';
                nav.style.display = 'block';
                nav.style.position = 'static';
                nav.style.width = 'auto';
                nav.style.backgroundColor = 'transparent';
                nav.style.boxShadow = 'none';
                nav.style.padding = '0';
            }
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        
        mobileMenuButton.addEventListener('click', function() {
            if (nav.style.display === 'none' || nav.style.display === '') {
                nav.style.display = 'block';
                this.classList.add('active');
                this.querySelectorAll('span')[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
                this.querySelectorAll('span')[1].style.opacity = '0';
                this.querySelectorAll('span')[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
            } else {
                nav.style.display = 'none';
                this.classList.remove('active');
                this.querySelectorAll('span')[0].style.transform = 'none';
                this.querySelectorAll('span')[1].style.opacity = '1';
                this.querySelectorAll('span')[2].style.transform = 'none';
            }
        });
    };
    
    createMobileMenu();
});