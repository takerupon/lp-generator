document.addEventListener('DOMContentLoaded', function() {
    // ヘッダースクロール効果
    const header = document.querySelector('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.style.padding = '8px 0';
            header.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.padding = '15px 0';
            header.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
        }
    });

    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // テスティモニアルスライダー
    const testimonials = document.querySelectorAll('.testimonial-item');
    let currentTestimonial = 0;
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    // 最初のテスティモニアル以外を非表示
    for (let i = 1; i < testimonials.length; i++) {
        testimonials[i].style.display = 'none';
    }

    // 次のテスティモニアルを表示
    function showNextTestimonial() {
        testimonials[currentTestimonial].style.opacity = '0';
        setTimeout(() => {
            testimonials[currentTestimonial].style.display = 'none';
            currentTestimonial = (currentTestimonial + 1) % testimonials.length;
            testimonials[currentTestimonial].style.display = 'block';
            setTimeout(() => {
                testimonials[currentTestimonial].style.opacity = '1';
            }, 50);
        }, 300);
    }

    // 前のテスティモニアルを表示
    function showPrevTestimonial() {
        testimonials[currentTestimonial].style.opacity = '0';
        setTimeout(() => {
            testimonials[currentTestimonial].style.display = 'none';
            currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
            testimonials[currentTestimonial].style.display = 'block';
            setTimeout(() => {
                testimonials[currentTestimonial].style.opacity = '1';
            }, 50);
        }, 300);
    }

    // 自動スライドショー
    let slideInterval = setInterval(showNextTestimonial, 5000);

    // スライドコントロールボタン
    nextBtn.addEventListener('click', function() {
        clearInterval(slideInterval);
        showNextTestimonial();
        slideInterval = setInterval(showNextTestimonial, 5000);
    });

    prevBtn.addEventListener('click', function() {
        clearInterval(slideInterval);
        showPrevTestimonial();
        slideInterval = setInterval(showNextTestimonial, 5000);
    });

    // テスティモニアルに初期スタイルを適用
    testimonials.forEach(testimonial => {
        testimonial.style.transition = 'opacity 0.3s ease';
        testimonial.style.opacity = '0';
    });
    testimonials[0].style.opacity = '1';

    // 数字カウントアップアニメーション
    const percentageElement = document.querySelector('.percentage');
    if (percentageElement) {
        const targetPercentage = 98;
        let currentPercentage = 0;
        
        // Intersection Observerを使用してビューポートに入ったときにアニメーションを開始
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const interval = setInterval(() => {
                        if (currentPercentage < targetPercentage) {
                            currentPercentage++;
                            percentageElement.textContent = currentPercentage + '%';
                        } else {
                            clearInterval(interval);
                        }
                    }, 20);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(percentageElement);
    }

    // 特徴アイテムのアニメーション
    const featureItems = document.querySelectorAll('.feature-item');
    const featureObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                featureObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    featureItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        featureObserver.observe(item);
    });

    // 料金カードのホバーエフェクト強化
    const pricingCards = document.querySelectorAll('.pricing-card');
    pricingCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('popular')) {
                this.style.transform = 'translateY(-15px)';
                this.style.boxShadow = '0 20px 30px rgba(0, 0, 0, 0.15)';
            } else {
                this.style.transform = 'scale(1.08)';
                this.style.boxShadow = '0 20px 30px rgba(0, 0, 0, 0.2)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('popular')) {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'var(--shadow)';
            } else {
                this.style.transform = 'scale(1.05)';
                this.style.boxShadow = 'var(--shadow)';
            }
        });
    });

    // お問い合わせフォームのバリデーション
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');
            let isValid = true;
            
            // 簡易バリデーション
            if (nameInput.value.trim() === '') {
                showError(nameInput, 'お名前を入力してください');
                isValid = false;
            } else {
                removeError(nameInput);
            }
            
            if (emailInput.value.trim() === '') {
                showError(emailInput, 'メールアドレスを入力してください');
                isValid = false;
            } else if (!isValidEmail(emailInput.value)) {
                showError(emailInput, '有効なメールアドレスを入力してください');
                isValid = false;
            } else {
                removeError(emailInput);
            }
            
            if (messageInput.value.trim() === '') {
                showError(messageInput, 'お問い合わせ内容を入力してください');
                isValid = false;
            } else {
                removeError(messageInput);
            }
            
            if (isValid) {
                // フォーム送信成功時の処理
                const submitButton = contactForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = '送信中...';
                
                // 送信成功の演出（実際はAjaxでサーバーに送信）
                setTimeout(() => {
                    submitButton.textContent = '送信完了！';
                    submitButton.style.backgroundColor = 'var(--accent-color)';
                    
                    // フォームをリセット
                    contactForm.reset();
                    
                    // 元に戻す
                    setTimeout(() => {
                        submitButton.disabled = false;
                        submitButton.textContent = originalText;
                        submitButton.style.backgroundColor = '';
                    }, 3000);
                }, 1500);
            }
        });
        
        function showError(input, message) {
            const formGroup = input.parentElement;
            let errorElement = formGroup.querySelector('.error-message');
            
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                errorElement.style.color = 'var(--secondary-color)';
                errorElement.style.fontSize = '0.85rem';
                errorElement.style.marginTop = '5px';
                formGroup.appendChild(errorElement);
            }
            
            errorElement.textContent = message;
            input.style.borderColor = 'var(--secondary-color)';
        }
        
        function removeError(input) {
            const formGroup = input.parentElement;
            const errorElement = formGroup.querySelector('.error-message');
            
            if (errorElement) {
                formGroup.removeChild(errorElement);
            }
            
            input.style.borderColor = '';
        }
        
        function isValidEmail(email) {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        }
    }

    // モバイルメニュートグル（ハンバーガーメニュー）
    const header_container = document.querySelector('header .container');
    const menuToggle = document.createElement('div');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<span></span><span></span><span></span>';
    menuToggle.style.display = 'none';
    menuToggle.style.flexDirection = 'column';
    menuToggle.style.justifyContent = 'space-between';
    menuToggle.style.width = '25px';
    menuToggle.style.height = '20px';
    menuToggle.style.cursor = 'pointer';
    
    menuToggle.querySelectorAll('span').forEach(span => {
        span.style.display = 'block';
        span.style.height = '2px';
        span.style.width = '100%';
        span.style.backgroundColor = 'var(--primary-color)';
        span.style.transition = 'var(--transition)';
    });
    
    header_container.appendChild(menuToggle);
    
    const nav = document.querySelector('nav');
    
    // レスポンシブ対応
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            menuToggle.style.display = 'flex';
            nav.style.display = 'none';
            nav.style.width = '100%';
            nav.style.marginTop = '15px';
            
            nav.querySelector('ul').style.flexDirection = 'column';
            nav.querySelector('ul').style.alignItems = 'center';
            nav.querySelector('ul').style.gap = '15px';
        } else {
            menuToggle.style.display = 'none';
            nav.style.display = 'block';
            nav.style.width = 'auto';
            nav.style.marginTop = '0';
            
            nav.querySelector('ul').style.flexDirection = '';
            nav.querySelector('ul').style.alignItems = '';
            nav.querySelector('ul').style.gap = '';
        }
    }
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    menuToggle.addEventListener('click', function() {
        if (nav.style.display === 'none' || nav.style.display === '') {
            nav.style.display = 'block';
            this.classList.add('active');
            
            // ハンバーガーメニューをXに変換
            this.querySelectorAll('span')[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
            this.querySelectorAll('span')[1].style.opacity = '0';
            this.querySelectorAll('span')[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
        } else {
            nav.style.display = 'none';
            this.classList.remove('active');
            
            // Xをハンバーガーメニューに戻す
            this.querySelectorAll('span')[0].style.transform = '';
            this.querySelectorAll('span')[1].style.opacity = '1';
            this.querySelectorAll('span')[2].style.transform = '';
        }
    });
});