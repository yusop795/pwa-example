/**
 * Service Worker
 */

const _version = 'v5';
const cacheName = 'v1';
/* 서비스워커 캐싱 리스트 */
/* 오프라인에서 페이지를 보여주기 위해 필요한 리소스를 모두 캐싱 */
const cacheList = [
  '/',
  '/manifest.json',
  '/scripts/app.js',
  '/styles/index.css',
  '/images/1.jpg',
  '/images/2.jpg',
  '/images/3.jpg',
  '/images/4.jpg',
  '/images/5.jpg',
  '/images/icons/icon-144x144.png',
]

const log = msg => {
  /* 서비스 워커 성공적으로 등록 시  */
  console.log(`[ServiceWorker ${_version}] ${msg}`);
}
/* 서비스 워커 생명 주기 테스트 */
// 1. 설치 단계
// Life cycle: INSTALL
self.addEventListener('install', event => {
  /* 기존 서비스워커가 존재 시 새 서비스워커 설치를 완료해도 바로 활성화가 되지 않고 
    기존 서비스워커가 종료되어야 활성화됐음(원칙) => skipWaiting 실행으로 서비스워커 업데이트 시 대기 상태 머무르지 않고 활성화되게 함 */
  self.skipWaiting();
  log('INSTALL');
  /* caches => 캐시를 저장하는 전역 객체
    open 메소드를 통해 지정한 이름의 개시를 불러올 수 있음
    만약 해당 이름의 캐시가 없으면 빈 캐시 반환
    받아온 캐시를 오프라인 환경에서도 불러올 수 있도록 필요한 리소스를 담는다
  */
  caches.open(cacheName).then(cache => {
    log('Caching app shell');
    /* cache.addAll()은 Promise를 반환 */
    /* addAll의 인자로는 캐싱할 리소스 URL이 있는 리스트를 받음 => cacheList로 대체 */
    /* 캐싱 작업 중 하나라도 실패할 경우 모두 실패 */
    return cache.addAll(cacheList);
  })
});

// 2. 활성화 단계 (등록 완료 후)
// Life cycle: ACTIVATE
self.addEventListener('activate', event => {
  log('Activate');
  /* waitUntil => 캐싱하는데 소요되는 시간만큼 install 단계를 연장 시켜 줌 */
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        /* 캐시네임이 일치하는지 확인 후, 일치하지 않으면 새로운 캐시로 간주 */
        if (key !== cacheName) {
          log('Removing old cache ' + key);
          return caches.delete(key);
        }
      }));
    })
  );
});

// 3. 
// Functional: FETCH
self.addEventListener('fetch', event => {
  log('Fetch ' + event.request.url);
  /* 요청할 리소스가 캐시 목록에 있는지 확인, 존재할 경우 캐싱한 데이터 제공, 
  아닐 경우 요청한 리소스로 fetch 할 수 있도록 구현 */
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});

/* jpg 요청 가로채기 
self.addEventListener('fetch', event => {
  log('Fetch ' + event.request.url);
  if (event.request.url.indexOf('.jpg') !== -1) {
    event.respondWith(fetch('/images/2.jpg'))
  }
});
*/

// Functional: PUSH
/* 1. 트리거 시 보여질 알림 설정 */
/*
self.addEventListener('push', ...);
서비스 워커에 이벤트 리스너(아래의 코드)를 추가하여 
서비스 워커에서 발생하는 푸시 이벤트를 수신할 수 있도록 합니다.

self = 서비스 워커 자체를 참고, 서비스 워커에 이벤트 리스너 추가

푸시 메시지 수신 -> 이벤트 리스너 실행 -> 등록 -> showNonfiction() 호출 -> 알림 생성

showNonfiction()은 title과 option 객체를 넘겨받을 수 있습니다
option =>  본문 메시지, 아이콘 및 배지 설정 가능

event.waitUntil()
프라미스를 취하며 브라우저는 전달된 프라미스가 확인될 때까지 서비스 워커를 활성화 및
실행 상태로 유지할 것
*/
self.addEventListener('push', event => {
  log('Push ' + event.data.text());

  // var message = JSON.parse(event.data.text());
  // console.log('pwa message', message);
  const title = 'My PWA!';
  const options = {
    body: event.data.text()
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


/* 2. 알림 클릭 시 발생될 일 정의 */
/* notificationclick 리스너 추가 */
/**
 * 사용자가 알림 클릭 -> 클릭한 알림 닫기 -> notificationclick 이벤트 리스너 호출 -> waitUntil 활용하여 지정해 준 브라우저가 표시되기 전에는 브라우저가 서비스 워커를 종료하지 못하도록 설정 
 * 
 */
self.addEventListener('notificationclick', function (event) {
  log('Push clicked');

  /* 푸시 클릭 시 알림 클로즈 */
  event.notification.close();
  /* 클릭 시 연동 시킬 url */
  event.waitUntil(
    clients.openWindow('https://www.jobplanet.co.kr')
  );
});

