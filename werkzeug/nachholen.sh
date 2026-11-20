#!/bin/bash
# Einmalig: bereits benutzte, noch fehlende Fremd-Sounds in die Sprechkabine laden (Mac).
set -u
P="$HOME/Projects"; S="$P/Kneipenschlaegerei/clips/sounds"; D="$HOME/Downloads/day15_sounds"
K="python3 $P/kabine_werkzeug/kabine.py sound"
F="Fremdes Material, Urheberrecht bei den Rechteinhabern; Hinweis, nicht blockierend."
$K $S/gun_cock.mp3 --id gun_cock --name "Gun Cock (Waffe durchladen)" --quelle "https://www.youtube.com/watch?v=eGzcSSGZzqM" --einsatz "Übergang Blaupause -> Designs" --lizenz "$F" --folgen day14_bbq_bar --stimmung spannung,schock --themen Kampf,Schnitt
$K $S/sugoi.mp3 --id sugoi --name "Sugoi (Anime-Sound)" --quelle "https://www.youtube.com/watch?v=KyQnA4WYwNo" --einsatz "Staunen bei Design 2" --lizenz "$F" --folgen day14_bbq_bar --stimmung freude,schock --themen Meme,Stimme
$K $S/minecraft_potion_drink.wav --id minecraft_potion_drink --name "Minecraft Potion Drinking" --quelle "https://www.youtube.com/watch?v=XxoOkmvMjmo" --einsatz "Trink-/Heiltrank-Moment (Gluckern)" --lizenz "$F" --folgen bier_video --stimmung witzig,ruhig --themen Minecraft,Gaming,Kneipe
$K $S/minecraft_drink.wav --id minecraft_drink --name "Minecraft Drinking Sound" --quelle "https://www.youtube.com/watch?v=SOJ9dv8OF3k" --einsatz "Figur trinkt Bier (Sip)" --lizenz "$F" --folgen bier_video --stimmung witzig,ruhig --themen Minecraft,Gaming,Kneipe
$K $D/grindr_ping.wav --id grindr_ping --name "Grindr-Ping (Dating-App-Benachrichtigung)" --quelle "https://www.youtube.com/watch?v=FwsPfa4-QGE" --einsatz "Hook und Endkarte Day 15" --lizenz "$F" --folgen day15_tinder --stimmung witzig,schock --themen Dating-App,Meme
$K $D/tinder_match.wav --id tinder_match --name "Tinder-Match" --quelle "https://www.youtube.com/watch?v=MVTyxzdeVZo" --einsatz "Match-Moment Day 15" --lizenz "$F" --folgen day15_tinder --stimmung freude --themen Dating-App
$K $D/okay_lets_go.wav --id okay_lets_go --name "Okay, let's go" --quelle "https://www.youtube.com/watch?v=td16THGMhEg" --einsatz "Kampfstart Day 15" --lizenz "$F" --folgen day15_tinder --stimmung episch,witzig --themen Meme,Kampf,Stimme
for i in 1 2 3; do $K $D/schwert_clash_$i.wav --id schwert_clash_$i --name "Schwertklirren $i" --quelle "https://www.youtube.com/watch?v=Eqhj354taQw" --einsatz "Zusammenstoß statt Faustschlag Day 15" --lizenz "$F" --folgen day15_tinder --stimmung episch,wut --themen "Kampf,Film & TV"; done
$K $D/vibration.wav --id vibration_handy --name "Handy vibriert (Tisch)" --quelle "https://www.youtube.com/watch?v=7GnaMhKQpsA" --einsatz "Day 15 Hook" --lizenz "Fremdes Material, Lizenz nicht geprüft [prüfen]" --folgen day15_tinder --stimmung spannung --themen Dating-App,Technik,Alarm
for i in 1 2 3; do $K $D/swipe_mixkit_$i.wav --id swipe_mixkit_$i --name "Swipe (Mixkit) $i" --quelle "https://mixkit.co/free-sound-effects/swipe/" --einsatz "Swipe Day 15" --lizenz "Mixkit Free License, frei nutzbar" --folgen day15_tinder --stimmung ruhig --themen Dating-App,Schnitt; done
$K $D/pop_1.wav --id pop_alert --name "Pop (Benachrichtigung, Mixkit)" --quelle "https://mixkit.co/free-sound-effects/pop/" --einsatz "Day 15" --lizenz "Mixkit Free License, frei nutzbar" --folgen day15_tinder --stimmung freude --themen Dating-App,Technik
