// スムーズスクロール実装
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      window.scrollTo({
        top: target.offsetTop - 70, // ヘッダーの高さ分調整
        behavior: 'smooth'
      });
    }
  });
});

// ヘッダーの背景色変更（スクロールに応じて）
window.addEventListener('scroll', function() {
  const header = document.querySelector('header');
  if (window.scrollY > 50) {
    header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
  } else {
    header.style.backgroundColor = 'var(--white)';
    header.style.boxShadow = 'var(--shadow)';
  }
});

// 特徴カードのアニメーション
const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach((card, index) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(50px)';
  card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  card.style.transitionDelay = `${index * 0.1}s`;
  
  setTimeout(() => {
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }, 300);
});

// 受講生の声カードのスライド表示
let currentTestimonial = 0;
const testimonialCards = document.querySelectorAll('.testimonial-card');
const totalTestimonials = testimonialCards.length;

// 初期表示設定
testimonialCards.forEach((card, index) => {
  if (index !== 0) {
    card.style.display = 'none';
  }
});

// 自動スライド機能
setInterval(() => {
  testimonialCards[currentTestimonial].style.opacity = '0';
  setTimeout(() => {
    testimonialCards[currentTestimonial].style.display = 'none';
    currentTestimonial = (currentTestimonial + 1) % totalTestimonials;
    testimonialCards[currentTestimonial].style.display = 'block';
    setTimeout(() => {
      testimonialCards[currentTestimonial].style.opacity = '1';
    }, 50);
  }, 500);
}, 5000);

// スクロール時の要素のフェードイン
const fadeInElements = document.querySelectorAll('section h2, .teacher-cards, .satisfaction-rate, form');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

fadeInElements.forEach(element => {
  element.style.opacity = '0';
  element.style.transform = 'translateY(20px)';
  element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(element);
});

// visible クラスが付与された時のスタイル適用
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
    .testimonial-card {
      transition: opacity 0.5s ease;
    }
  </style>
`);

// CTAボタンのパルスアニメーション
const ctaButton = document.querySelector('.cta-button a');
ctaButton.classList.add('pulse');
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .pulse {
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(255, 107, 74, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(255, 107, 74, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(255, 107, 74, 0);
      }
    }
  </style>
`);

// フォームのバリデーション強化
const form = document.querySelector('form');
form.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  
  if (!name || !email) {
    showFormError('必須項目を入力してください');
    return;
  }
  
  if (!isValidEmail(email)) {
    showFormError('有効なメールアドレスを入力してください');
    return;
  }
  
  // 送信成功メッセージ（実際の送信処理は別途実装が必要）
  showFormSuccess('お申し込みありがとうございます！担当者からご連絡いたします。');
  form.reset();
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFormError(message) {
  removeFormMessages();
  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error';
  errorDiv.textContent = message;
  errorDiv.style.color = '#ff4d4d';
  errorDiv.style.padding = '10px 0';
  errorDiv.style.fontWeight = 'bold';
  form.prepend(errorDiv);
}

function showFormSuccess(message) {
  removeFormMessages();
  const successDiv = document.createElement('div');
  successDiv.className = 'form-success';
  successDiv.textContent = message;
  successDiv.style.color = 'var(--secondary-color)';
  successDiv.style.padding = '15px';
  successDiv.style.fontWeight = 'bold';
  successDiv.style.backgroundColor = 'rgba(38, 203, 160, 0.1)';
  successDiv.style.borderRadius = 'var(--border-radius)';
  successDiv.style.marginBottom = '20px';
  form.prepend(successDiv);
}

function removeFormMessages() {
  const errorMessage = document.querySelector('.form-error');
  const successMessage = document.querySelector('.form-success');
  if (errorMessage) errorMessage.remove();
  if (successMessage) successMessage.remove();
}

// 講師カードの画像プレースホルダーに実際の画像を設定（ランダム画像を使用）
document.querySelectorAll('.teacher-image-placeholder').forEach((placeholder, index) => {
  placeholder.style.backgroundImage = `url('https://randomuser.me/api/portraits/women/${index + 10}.jpg')`;
  placeholder.style.backgroundSize = 'cover';
  placeholder.style.backgroundPosition = 'center';
});

// 満足度のカウントアップアニメーション
const satisfactionSection = document.getElementById('satisfaction');
const satisfactionNumber = document.querySelector('.satisfaction-rate h2');
let animated = false;

window.addEventListener('scroll', function() {
  if (!animated && isInViewport(satisfactionSection)) {
    animated = true;
    animateCountUp(satisfactionNumber, 98, 2000);
  }
});

function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top <= window.innerHeight && 
    rect.bottom >= 0
  );
}

function animateCountUp(element, target, duration) {
  let start = 0;
  const increment = target / (duration / 16);
  
  function updateNumber() {
    start += increment;
    if (start >= target) {
      element.textContent = `満足度${target}%`;
      return;
    }
    element.textContent = `満足度${Math.floor(start)}%`;
    requestAnimationFrame(updateNumber);
  }
  
  updateNumber();
}

// レスポンシブメニュー
if (window.innerWidth <= 768) {
  const nav = document.querySelector('nav');
  const header = document.querySelector('header .container');
  
  // ハンバーガーメニューボタン作成
  const menuButton = document.createElement('button');
  menuButton.classList.add('menu-toggle');
  menuButton.innerHTML = '<i data-lucide="menu"></i>';
  menuButton.style.background = 'none';
  menuButton.style.border = 'none';
  menuButton.style.fontSize = '24px';
  menuButton.style.cursor = 'pointer';
  menuButton.style.color = 'var(--primary-color)';
  header.appendChild(menuButton);
  
  // メニュー表示切り替え
  nav.style.display = 'none';
  nav.style.position = 'absolute';
  nav.style.top = '100%';
  nav.style.left = '0';
  nav.style.width = '100%';
  nav.style.backgroundColor = 'var(--white)';
  nav.style.boxShadow = 'var(--shadow)';
  nav.style.padding = '20px';
  
  nav.querySelector('ul').style.flexDirection = 'column';
  
  menuButton.addEventListener('click', function() {
    if (nav.style.display === 'none') {
      nav.style.display = 'block';
      menuButton.innerHTML = '<i data-lucide="x"></i>';
      lucide.createIcons();
    } else {
      nav.style.display = 'none';
      menuButton.innerHTML = '<i data-lucide="menu"></i>';
      lucide.createIcons();
    }
  });
  
  // メニュー項目クリック時に閉じる
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function() {
      nav.style.display = 'none';
      menuButton.innerHTML = '<i data-lucide="menu"></i>';
      lucide.createIcons();
    });
  });
  
  lucide.createIcons();
}