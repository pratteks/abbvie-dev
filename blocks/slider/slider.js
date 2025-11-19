import { fetchPlaceholders } from '../../scripts/placeholders.js';
import getEnvConfig from '../../scripts/utils/envConfig.js';
import { fetchLearningPrograms } from '../../scripts/utils/api.js';
import {
  filterEligibleCourses,
  generateCourseUrls,
  deduplicateCoursesByBaseCohortId,
} from '../../scripts/utils/courseUtils.js';

const envConfig = getEnvConfig();

// USER CONSTANTS
const USER = {
  GUEST_ID: 'guest',
  GUEST_NAME: 'Guest',
  DEFAULT_NAME: 'User',
  FETCH_FAILED: 'User fetch failed',
};

// CONFIG CONSTANTS
const CONFIGS = {
  AUTO_ROTATION_TIME: 'auto-rotation-time',
  MAX_SLIDES: 'max-slides',
  VIEW_COURSE_LABEL: 'view-course-button-label',
};

// ENROLLMENT CONSTANTS
const ENROLLMENT = {
  STATES: ['enrolled', 'started', 'inProgress', 'completed'],
  TYPES: ['learningProgram', 'course'],
  REL_KEYS: {
    INSTANCES: 'instances',
    ENROLLMENT: 'enrollment',
    INSTANCE: 'learningObjectInstance',
    INSTANCE_ENROLLMENT: 'learningObjectInstanceEnrollment',
  },
  ACTIVE_STATE: 'active',
};

// EVENT CONSTANTS
const EVENTS = {
  MOUSE_DOWN: 'mousedown',
  MOUSE_ENTER: 'mouseenter',
  MOUSE_LEAVE: 'mouseleave',
};

// FALLBACKS
const FALLBACK = {
  ROTATION_TIME: 5000,
  MAX_SLIDES: 4,
  TYPE: 'promotion',
  TITLE: 'Featured Content',
  DESCRIPTION: 'Explore this opportunity',
  URL: '#',
  IMAGE: null,
  EMPTY_MESSAGE: 'Check back soon for new learning opportunities!',
  ERROR_TITLE: 'Unable to load content',
  ERROR_MESSAGE: 'Please refresh the page.',
  VIEW_COURSE_LABEL: 'View Course',
};

/* CONFIG HANDLERS */
const CONFIG_HANDLERS = {
  [CONFIGS.AUTO_ROTATION_TIME]: (config, value) => {
    const parsed = parseInt(value, 10);
    config.autoRotationTime = !Number.isNaN(parsed) ? parsed * 1000 : null;
  },
  [CONFIGS.MAX_SLIDES]: (config, value) => {
    const parsed = parseInt(value, 10);
    config.maxSlides = !Number.isNaN(parsed) ? parsed : null;
  },
  [CONFIGS.VIEW_COURSE_LABEL]: (config, value) => {
    if (value?.trim()) config.viewCourseLabel = value.trim();
  },
};

/* USER FETCH LOGIC */
async function getUserData() {
  const token = sessionStorage.getItem('alm_access_token');
  if (!token) {
    return {
      id: USER.GUEST_ID,
      name: USER.GUEST_NAME,
      avatar: null,
      enrolledCourses: [],
      enrolledCohorts: [],
      isAuthenticated: false,
    };
  }

  try {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.api+json' };
    const userRes = await fetch(`${envConfig.almApiBaseUrl}/user`, { headers });

    if (!userRes.ok) throw new Error(USER.FETCH_FAILED);
    const userData = await userRes.json();
    const user = userData.data;

    return {
      id: user.id,
      name: user.attributes?.name || USER.DEFAULT_NAME,
      avatar: user.attributes?.avatarUrl || null,
      enrolledCourses: [],
      enrolledCohorts: [],
      isAuthenticated: true,
    };
  } catch {
    return {
      id: USER.GUEST_ID,
      name: USER.GUEST_NAME,
      avatar: null,
      enrolledCourses: [],
      enrolledCohorts: [],
      isAuthenticated: false,
    };
  }
}

/* PARSE BLOCK CONFIGURATION */
function parseBlockConfiguration(block) {
  const rows = block.querySelectorAll(':scope > div');

  const autoRotationTime = parseInt(rows[0].textContent.trim(), 10) * 1000;

  const maxSlides = parseInt(rows[1].textContent.trim(), 10);

  const config = {
    autoRotationTime: autoRotationTime || FALLBACK.ROTATION_TIME,
    maxSlides,
    authoredContent: [],
    viewCourseLabel: FALLBACK.VIEW_COURSE_LABEL,
  };

  rows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    if (cells.length < 2) return;

    const key = cells[0].textContent.trim().toLowerCase();
    const value = cells[1].textContent.trim();

    if (CONFIG_HANDLERS[key]) {
      CONFIG_HANDLERS[key](config, value);
      return;
    }

    if (cells.length >= 4) {
      const title = cells[0].textContent.trim();
      const desc = cells[1].textContent.trim();
      const url = cells[2].querySelector('a')?.href || cells[2].textContent.trim();
      const ctaLabel = cells[3].textContent.trim();
      const img = cells[4].querySelector('img')?.src || cells[4].textContent.trim();

      config.authoredContent.push({
        type: FALLBACK.TYPE,
        name: title || FALLBACK.TITLE,
        description: desc || FALLBACK.DESCRIPTION,
        enrollmentUrl: url || FALLBACK.URL,
        imageUrl: img || FALLBACK.IMAGE,
        ctaLabel,
        isAuthored: true,
      });
    }
  });
  return config;
}

/* UI HELPERS */
const createWelcomeMessage = (user) => {
  const initials = user.name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const avatarHTML = user.avatar
    ? `<img src="${user.avatar}" alt="${user.name}" loading="lazy" />`
    : `<span class="initials">${initials}</span>`;

  const el = document.createElement('div');
  el.className = 'carousel-welcome';
  el.innerHTML = `
    <div class="welcome-profile">
      <div class="profile-avatar">${avatarHTML}</div>
      <div class="welcome-text"><h2>Hi ${user.name.split(' ')[0]}</h2></div>
    </div>`;
  return el;
};

const createSlide = (course, index) => {
  const slide = document.createElement('div');
  slide.className = 'carousel-slide';
  slide.dataset.slideIndex = index;

  const ctaText = course.ctaLabel;
  const title = course.name || FALLBACK.TITLE;
  const desc = course.description || FALLBACK.DESCRIPTION;

  const imageHTML = course.imageUrl
    ? `<div class="slide-image"><img src="${course.imageUrl}" alt="${title}" loading="lazy" /></div>`
    : `<div class="slide-background gradient-${(index % 4) + 1}"></div>`;

  slide.innerHTML = `
    ${imageHTML}
    <div class="slide-content">
      <h3>${title}</h3>
      <p class="course-description">${desc}</p>
      <a href="${course.enrollmentUrl}" class="cta-button" aria-label="${ctaText}">
        ${ctaText}
      </a>
    </div>`;
  return slide;
};

/* CAROUSEL BEHAVIOR */
function initializeCarousel(carousel, config) {
  const slidesContainer = carousel.querySelector('.carousel-slides');
  const slides = [...carousel.querySelectorAll('.carousel-slide')];
  const indicators = [...carousel.querySelectorAll('.carousel-indicator')];
  let current = 0;
  let timer;

  const rotationTime = config.autoRotationTime || 5000;

  const show = (i) => {
    current = (i + slides.length) % slides.length;
    slidesContainer.style.transform = `translateX(-${current * 100}%)`;
    indicators.forEach((btn, idx) => btn.classList.toggle('active', idx === current));
  };

  const next = () => show(current + 1);
  const stop = () => timer && clearInterval(timer);
  const start = () => {
    stop();
    if (slides.length > 1) timer = setInterval(next, rotationTime);
  };

  indicators.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      show(idx);
      stop();
      setTimeout(start, rotationTime);
      btn.blur();
    });
  });

  carousel.addEventListener(EVENTS.MOUSE_ENTER, stop);
  carousel.addEventListener(EVENTS.MOUSE_LEAVE, start);

  show(0);
  start();
}

/* MAIN DECORATE FUNCTION */
export default async function decorate(block) {
  const [placeholders, contentIds] = await Promise.all([
    fetchPlaceholders(),
    [...block.querySelectorAll('p')].flatMap((p) =>
      p.textContent
        .split(',')
        .map((x) => x.trim())
        .filter((x) => ENROLLMENT.TYPES.some((type) => x.startsWith(`${type}:`)))
        .map((x) => {
          const [prefix, id] = x.split(':');
          return id ? `${prefix}:${id}` : null;
        })
        .filter(Boolean)
    ),
  ]);

  const config = parseBlockConfiguration(block);
  block.querySelectorAll(':scope > div').forEach((r) => {
    r.style.display = 'none';
  });

  const container =
    block.querySelector('.learning-carousel-container') ||
    block.appendChild(document.createElement('div'));
  container.className = 'learning-carousel-container';

  try {
    const user = await getUserData();
    const { maxSlides } = config;

    if (user.isAuthenticated) container.appendChild(createWelcomeMessage(user));

    const suggested = document.createElement('div');
    suggested.className = 'carousel-suggested-text';
    suggested.innerHTML = `<p>${placeholders.suggestedForYou}</p>`;
    container.appendChild(suggested);

    let allContent = [...config.authoredContent];
    if (user.isAuthenticated && contentIds.length) {
      try {
        const api = await fetchLearningPrograms(contentIds);
        const filtered = filterEligibleCourses(api.data, api.included);

        // Deduplicate courses by base cohort ID - show only one cohort per unique cohort type
        const uniqueFiltered = deduplicateCoursesByBaseCohortId(filtered);

        const normalizedCourses = uniqueFiltered.map((course) => {
          const meta = course.attributes?.localizedMetadata?.[0] || {};
          const { url: enrollmentUrl } = generateCourseUrls(course);

          return {
            id: course.id,
            name: meta.name || course.name || FALLBACK.TITLE,
            description: meta.description || FALLBACK.DESCRIPTION,
            enrollmentUrl,
            imageUrl: course.attributes?.bannerUrl || FALLBACK.IMAGE,
            ctaLabel: config.viewCourseLabel || FALLBACK.VIEW_COURSE_LABEL,
            type: course.type,
            isAuthored: false,
          };
        });

        allContent.push(...normalizedCourses);
      } catch {
        /* ignore */
      }
    }

    allContent = allContent.slice(0, maxSlides);

    if (allContent.length) {
      const wrapper = document.createElement('div');
      wrapper.className = 'carousel-wrapper';
      const slidesContainer = document.createElement('div');
      slidesContainer.className = 'carousel-slides';
      allContent.forEach((c, i) => slidesContainer.appendChild(createSlide(c, i)));
      wrapper.appendChild(slidesContainer);

      if (allContent.length > 1) {
        const indicators = document.createElement('div');
        indicators.className = 'carousel-indicators';
        indicators.innerHTML = Array.from(
          { length: allContent.length },
          (_, i) =>
            `<button class="carousel-indicator ${i === 0 ? 'active' : ''}" data-slide="${i}" aria-label="Go to slide ${i + 1}"></button>`
        ).join('');
        wrapper.appendChild(indicators);
      }

      container.appendChild(wrapper);
      setTimeout(() => initializeCarousel(wrapper, config), 100);
    }
  } catch (err) {
    const errorEl = document.createElement('div');
    errorEl.className = 'carousel-error';
    errorEl.innerHTML = `
      <h3>${FALLBACK.ERROR_TITLE}</h3>
      <p>${FALLBACK.ERROR_MESSAGE}</p>
      <p><strong>Debug:</strong> ${err.message}</p>`;
    container.appendChild(errorEl);
  }
}
