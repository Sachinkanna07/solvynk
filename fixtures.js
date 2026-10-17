/* ==========================================================================
   SOLVYNK REALISTIC FIXTURE CATALOG (Section 24)
   ========================================================================== */

window.SolvynkFixtureCatalog = {
  brand: {
    name: "Solvynk",
    tagline: "Real Problems. Independent Solutions. Lasting Proof of Work.",
    betaWindow: "Phase P Beta · India-first",
    version: "v0.1.0-prebuild"
  },

  categories: [
    "Data & AI",
    "Developer Tools",
    "Accessibility & Voice",
    "Sensors & Hardware",
    "Education",
    "Civic & Community"
  ],

  users: [
    {
      handle: "kaveri_collective",
      name: "Kaveri Research Collective",
      role: "Problem Owner",
      affiliation: "Environmental NGO, Chennai",
      avatar: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&auto=format&fit=crop&q=80",
      bio: "Advancing decentralised community water security across Tamil Nadu basin."
    },
    {
      handle: "arun_raman",
      name: "Arun Raman",
      role: "Builder",
      affiliation: "Indie Hardware Builder, Chennai",
      github: "arunraman-dev",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      bio: "Building low-cost embedded systems and environmental sensors."
    },
    {
      handle: "meera_krishnan",
      name: "Meera Krishnan",
      role: "Builder",
      affiliation: "AI Researcher, Coimbatore",
      github: "meerakrish",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
      bio: "Focusing on low-resource Indic speech models and edge inference."
    },
    {
      handle: "karthik_v",
      name: "Karthik Venkatesh",
      role: "Builder",
      affiliation: "Systems Engineer, Bengaluru",
      github: "karthikv-oss",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
      bio: "WebAssembly compiler optimizations and developer productivity tools."
    },
    {
      handle: "tamil_nlp_lab",
      name: "Tamil NLP Foundation",
      role: "Problem Owner",
      affiliation: "Academic Research Lab, Madurai",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      bio: "Democratizing open datasets and speech benchmarks for modern Tamil dialects."
    }
  ],

  // Comprehensive Problem Statements
  problems: [
    {
      id: "PRB-001",
      slug: "tamil-voice-recognition",
      title: "Real-time Tamil Speech-to-Text for Low-Resource Edge Devices",
      category: "Accessibility & Voice",
      owner: "Tamil NLP Foundation",
      ownerHandle: "tamil_nlp_lab",
      location: "Madurai, Tamil Nadu",
      window: "Challenge closes 30 Nov 2026",
      status: "Open for Solutions",
      summary: "Most existing STT APIs fail on regional Tamil dialects and require continuous cloud connectivity. We need lightweight models runnable directly in browser or Android devices without cloud latency.",
      constraints: "Model weight must remain under 45 MB. Maximum latency < 120ms on a quad-core mobile CPU. No proprietary cloud API calls allowed.",
      requirements: [
        { code: "R1", label: "Real-time Inference", text: "Streaming transcription latency under 120ms on commodity hardware." },
        { code: "R2", label: "Tamil Unicode Output", text: "Accurate Tamil script formatting with correct pulli and kombu handling." },
        { code: "R3", label: "Background Noise Robustness", text: "Maintain >85% word accuracy in typical Indian outdoor/street noise (>15dB SNR)." },
        { code: "R4", label: "100% Offline Capability", text: "Zero network telemetry or server dependencies during runtime inference." }
      ],
      solutionsCount: 3,
      featuredSolutionSlug: "kuralvoice"
    },
    {
      id: "PRB-002",
      slug: "clean-water-testing",
      title: "Decentralised Community Water Quality Monitor",
      category: "Sensors & Hardware",
      owner: "Kaveri Research Collective",
      ownerHandle: "kaveri_collective",
      location: "Thanjavur, Tamil Nadu",
      window: "Challenge closes 15 Dec 2026",
      status: "Open for Solutions",
      summary: "Villages across the delta need affordable, rugged test kits to detect sudden industrial discharge and high salinity without sending samples to distant district labs.",
      constraints: "BOM cost must stay below ₹3,000. Battery life must sustain at least 14 days of solar-assisted field operation.",
      requirements: [
        { code: "R1", label: "Turbidity & TDS Sensing", text: "Accurate optical turbidity and Total Dissolved Solids measurement." },
        { code: "R2", label: "Instant Status Lights", text: "Immediate green/amber/red indicator lights for non-literate volunteers." },
        { code: "R3", label: "Offline Data Logging", text: "Store at least 500 timestamped readings locally in flash memory." },
        { code: "R4", label: "LoRa / Mesh Sync", text: "Long-range broadcast capability to village panchayat gateway." }
      ],
      solutionsCount: 2,
      featuredSolutionSlug: "clearflow"
    },
    {
      id: "PRB-003",
      slug: "offline-student-mentor-map",
      title: "Low-Bandwidth Career & Skill Pathways for Rural Colleges",
      category: "Education",
      owner: "First Step Foundation",
      ownerHandle: "first_step",
      location: "Coimbatore, Tamil Nadu",
      window: "Open Challenge",
      status: "Open for Solutions",
      summary: "First-generation engineering students lack structured guidance on roadmap prerequisites and free public resources in their mother tongue.",
      constraints: "Total web bundle must load under 250 KB on 2G connections.",
      requirements: [
        { code: "R1", label: "Structured Roadmaps", text: "Step-by-step role prerequisites explained in clear Tamil and English." },
        { code: "R2", label: "Offline Bookmark Storage", text: "Full progress tracking cached in browser IndexedDB." },
        { code: "R3", label: "Zero-Tracking Guarantee", text: "No third-party trackers, ad scripts, or external telemetry." }
      ],
      solutionsCount: 1,
      featuredSolutionSlug: "pathfinder"
    }
  ],

  // Comprehensive Project Showcases
  projects: [
    {
      id: "PRJ-101",
      slug: "kuralvoice",
      title: "KuralVoice — Ultra-Fast On-Device Tamil STT",
      creator: "Meera Krishnan",
      creatorHandle: "meera_krishnan",
      category: "Accessibility & Voice",
      stage: "Working Demo",
      sourceStatus: "Public GitHub Repository",
      githubRepo: "meerakrish/kural-voice-onnx",
      stars: 142,
      language: "Python / C++",
      license: "Apache-2.0",
      valueLine: "Speech-to-text quantized for edge Android and Raspberry Pi devices with sub-90ms latency.",
      demoUrl: "https://kuralvoice-demo.vercel.app",
      demoStatus: "verified_safe",
      stack: ["ONNX Runtime", "Conformer", "FastAPI", "Web Audio API"],
      worksToday: [
        "Transcribes conversational Tamil at 85ms median latency on ARM64.",
        "Generates clean UTF-8 Tamil unicode strings with punctuation restoration.",
        "Operates completely offline with a quantized 38 MB ONNX model."
      ],
      limitations: [
        "Accuracy drops under heavy babble noise (>20dB noise).",
        "Currently tuned primarily for Chennai and Madurai dialect variants."
      ],
      coverImage: "https://images.unsplash.com/photo-1589254065878-42c9da997008?w=800&auto=format&fit=crop&q=80",
      screenshots: [
        "https://images.unsplash.com/photo-1589254065878-42c9da997008?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"
      ],
      updates: [
        { date: "14 Oct 2026", title: "INT8 Quantization Shipped", body: "Reduced model footprint from 140MB down to 38.4MB with less than 1.2% WER degradation." },
        { date: "28 Sep 2026", title: "Initial Benchmark on Tirukkural Audio", body: "Completed first automated evaluation benchmark against 1,330 verse recordings." }
      ]
    },
    {
      id: "PRJ-102",
      slug: "tamilwhisper-wasm",
      title: "TamilWhisper WASM",
      creator: "Karthik Venkatesh",
      creatorHandle: "karthik_v",
      category: "Accessibility & Voice",
      stage: "Released",
      sourceStatus: "Public GitHub Repository",
      githubRepo: "karthikv-oss/tamil-whisper-wasm",
      stars: 318,
      language: "Rust / C",
      license: "MIT",
      valueLine: "Zero-server, pure browser client WebAssembly Tamil voice recognizer powered by whisper.cpp.",
      demoUrl: "https://tamil-whisper.pages.dev",
      demoStatus: "verified_safe",
      stack: ["Rust", "WebAssembly", "Web Workers", "IndexedDB"],
      worksToday: [
        "Streams live mic audio directly through WebAssembly SIMD.",
        "Robust noise suppression filters built into the audio pipeline.",
        "Zero server communications—works on airplane mode in Chrome/Safari."
      ],
      limitations: [
        "Requires WebAssembly SIMD support (modern browsers only).",
        "Initial download is 42 MB on first page visit."
      ],
      coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
      screenshots: [
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80"
      ],
      updates: [
        { date: "02 Oct 2026", title: "Version 1.2 Released", body: "Added Safari iOS 17 WebAssembly audio thread compatibility." }
      ]
    },
    {
      id: "PRJ-103",
      slug: "tamspeech-lite",
      title: "TamSpeech-Lite Android",
      creator: "Arun Raman",
      creatorHandle: "arun_raman",
      category: "Accessibility & Voice",
      stage: "Prototype",
      sourceStatus: "Private Source — Manually Described",
      githubRepo: null,
      stars: null,
      language: "Kotlin / C++",
      license: "Proprietary",
      valueLine: "Embedded Android service for regional voice commands in Tamil agricultural apps.",
      demoUrl: null, // No demo available
      demoStatus: "none",
      stack: ["Kotlin", "NCNN", "TensorFlow Lite"],
      worksToday: [
        "Recognizes 120 essential farm commands (irrigation, weather, price).",
        "Lightweight APK footprint under 14 MB."
      ],
      limitations: [
        "Limited to fixed command grammar rather than open dictation.",
        "Private research prototype; code not public."
      ],
      coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
      screenshots: [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80"
      ],
      updates: [
        { date: "20 Sep 2026", title: "Field Test at Thanjavur Farm", body: "Tested voice triggers in active tractor noise with 7 farmers." }
      ]
    },
    {
      id: "PRJ-104",
      slug: "clearflow",
      title: "ClearFlow — Open Community Water Station",
      creator: "Arun Raman",
      creatorHandle: "arun_raman",
      category: "Sensors & Hardware",
      stage: "Shipped Update",
      sourceStatus: "Public GitHub Repository",
      githubRepo: "arunraman-dev/clearflow-firmware",
      stars: 89,
      language: "C++ / FreeRTOS",
      license: "GPL-3.0",
      valueLine: "Rugged ESP32-based water monitoring station with LoRa mesh telemetry and local alert LEDs.",
      demoUrl: "https://clearflow-monitor.org",
      demoStatus: "verified_safe",
      stack: ["ESP32", "LoRaWAN", "FreeRTOS", "Grafana"],
      worksToday: [
        "Measures Turbidity, TDS, and temperature within 90 seconds.",
        "Bright tri-color status indicator for instant non-technical comprehension.",
        "Transmits over 8km line-of-sight via 868MHz LoRa mesh."
      ],
      limitations: [
        "Optical turbidity sensor requires recalibration every 30 days.",
        "Enclosure currently 3D-printed; tooling needed for injection molding."
      ],
      coverImage: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
      screenshots: [
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80"
      ],
      updates: [
        { date: "10 Oct 2026", title: "Deploying Station 3 in delta region", body: "Solar harvesting circuit maintained continuous power through 4 overcast monsoon days." }
      ]
    }
  ],

  // BuildTree Solution Links & Matrix Data
  solutionLinks: [
    {
      problemSlug: "tamil-voice-recognition",
      projectSlug: "kuralvoice",
      coverage: {
        R1: { state: "confirmed", note: "Verified 85ms on Raspberry Pi 4" },
        R2: { state: "confirmed", note: "Passed Tamil unicode stress test" },
        R3: { state: "claimed", note: "Builder claims 88% in street noise" },
        R4: { state: "unaddressed", note: "Cloud fallback present in demo" }
      },
      featured: true,
      ownerReview: "Outstanding responsiveness on Tamil verses. Highly recommended for local app developers.",
      officialStatus: "none"
    },
    {
      problemSlug: "tamil-voice-recognition",
      projectSlug: "tamilwhisper-wasm",
      coverage: {
        R1: { state: "confirmed", note: "Benchmarked at 110ms on modern laptops" },
        R2: { state: "confirmed", note: "Full Unicode output verified" },
        R3: { state: "confirmed", note: "Whisper noise filter excels in café environments" },
        R4: { state: "confirmed", note: "100% pure client WebAssembly execution" }
      },
      featured: false,
      ownerReview: "Technically exceptional engineering. Partnering with the lab for official benchmark release.",
      officialStatus: "confirmed_official"
    },
    {
      problemSlug: "tamil-voice-recognition",
      projectSlug: "tamspeech-lite",
      coverage: {
        R1: { state: "claimed", note: "Sub-100ms on Android" },
        R2: { state: "confirmed", note: "Verified Tamil command labels" },
        R3: { state: "unaddressed", note: "Not tested in high noise" },
        R4: { state: "confirmed", note: "Standalone APK execution" }
      },
      featured: false,
      ownerReview: "Promising prototype for agricultural vocabularies.",
      officialStatus: "none"
    },
    {
      problemSlug: "clean-water-testing",
      projectSlug: "clearflow",
      coverage: {
        R1: { state: "confirmed", note: "Dual probe sensor calibrated in lab" },
        R2: { state: "confirmed", note: "Field tested with local volunteers" },
        R3: { state: "confirmed", note: "Flash logs up to 1,000 records" },
        R4: { state: "claimed", note: "LoRa range verified at 5km" }
      },
      featured: true,
      ownerReview: "The most practical hardware implementation we have seen. Tested during Cauvery water rounds.",
      officialStatus: "confirmed_official"
    }
  ]
};
