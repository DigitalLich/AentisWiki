const isLocal = location.hostname === "127.0.0.1" || location.hostname === "localhost";
    if (isLocal) {
    document.write('<base href="/">');
    } else {
    document.write('<base href="/AentisWiki/">');
    }