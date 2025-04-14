
<div class="smoke-bg"></div>

<style lang="post-css">

    .smoke-bg {
        @apply absolute -left-1/2 -top-1/2 w-[calc(200%)] h-[calc(200%)];
        background:
            radial-gradient(circle at 25% 40%, #a259ff55, transparent 60%),
            radial-gradient(circle at 65% 50%, #00cfff44, transparent 60%),
            radial-gradient(circle at 45% 65%, #ffce0044, transparent 60%);
        filter: blur(100px);
        animation: flow 10s linear infinite;
    }

    @keyframes flow {
        0% {
            transform: scale(1) translate(-30px, 0px) rotate(0deg);
        }
        50% {
            transform: scale(1.05) translate(30px, -30px) rotate(180deg);
        }
        100% {
            transform: scale(1) translate(-30px, 0px) rotate(360deg);
        }
    }

</style>