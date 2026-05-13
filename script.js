const homeScreen = document.getElementById('home-screen');
const uiLayer = document.getElementById('ui-layer');
const storyText = document.getElementById('story-text');
const choicesDiv = document.getElementById('choices');
const bgMusic = document.getElementById('bg-music');

function startGame() {
    homeScreen.style.display = 'none';
    uiLayer.style.display = 'block';
    
    // Start the audio loop you provided
    bgMusic.play();
    bgMusic.volume = 0.5;

    updateStory(
        "The smell of antiseptic and rot fills your nose. You are strapped to a rusted gurney in Ward 4 of the Blackwood Asylum. The leather straps are old and frayed.",
        [
            { text: "Struggle to break free", path: 'struggle' },
            { text: "Wait for the 'Doctor'", path: 'wait' }
        ]
    );
}

function updateStory(text, choices) {
    storyText.innerText = text;
    choicesDiv.innerHTML = ""; 

    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.innerText = choice.text;
        btn.onclick = () => handleChoice(choice.path);
        choicesDiv.appendChild(btn);
    });
}

function handleChoice(path) {
    switch(path) {
        case 'struggle':
            updateStory(
                "The leather snaps. You tumble onto the cold tile floor. To your left, a surgery door swings open. To your right, a dark staircase leads to the morgue.",
                [
                    { text: "Enter the Surgery Room", path: 'surgery' },
                    { text: "Go down to the Morgue", path: 'morgue' }
                ]
            );
            break;
        case 'wait':
            updateStory(
                "The lights hum aggressively. You hear the rhythmic squeak of a cart wheel approaching. A shadow under the door stops. You shouldn't have waited.",
                [
                    { text: "RESTART", path: 'start' }
                ]
            );
            break;
        case 'surgery':
            updateStory(
                "Jars of preserved specimens line the walls. One jar on the desk contains a human eye. It follows your movement.",
                [
                    { text: "Smash the jar", path: 'smash' },
                    { text: "Search the desk for a key", path: 'key' }
                ]
            );
            break;
        case 'morgue':
            updateStory(
                "It's freezing here. The metal drawers are all closed, except for one. A frost-covered hand hangs out, holding a silver whistle.",
                [
                    { text: "Take the whistle", path: 'whistle' },
                    { text: "Back away slowly", path: 'struggle' }
                ]
            );
            break;
        case 'start':
            location.reload();
            break;
        default:
            updateStory("The darkness swallows you whole.", [{ text: "RESTART", path: 'start' }]);
    }
}
