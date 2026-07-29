@echo off
setlocal enabledelayedexpansion
rem Set the message to issue as second line
set "msg=*         %*         *"
rem Calculate the length of the string
set Length=0
for /l %%A in (1,1,1000) do if "%msg%"=="!msg:~0,%%A!" (
  set /a Length=%%A
  goto :doit
)
:doit
rem Create a string of asterisks of same length
set header=
for /l %%i in (1,1,%Length%) do set "header=!header!*
rem Issue the message
echo %header%
echo %msg%
echo %header%

title Government Batch File NX-1947

echo off
color 0a
:1
Cls
echo. =============================================================================
echo.
echo.                          	Welcome to Section 42
echo.
echo.			An Underground Sector of the Cerberus Division
echo.				Blackbook Operations
echo. =============================================================================
echo.
echo.                   	What application do you need help with?
echo.			
echo.				
echo.
echo.                  	Type "command" = for a list of commands
echo.	    
echo.		    Type "topsecret" = for a list of the directory. 
echo.
echo.
echo. =============================================================================


set /p app=
if %app%==back2thefuture goto back2thefuture
if %app%==NCC-1701 goto NCC-1701
if %app%==ringaroundtherosie goto ringaroundtherosie
if %app%==topsecret goto topsecret
if %app%==followthewhiterabbit goto followthewhiterabbit
if %app%==skynet goto skynet
if %app%==ghostinthemachine goto ghostinthemachine
if %app%==strobe goto strobe
if %app%==parrot goto parrot
if %app%==installcommands goto installcommands
if %app%==command goto command
if %app%==ninjaturtle goto ninjaturtle
if %app%==Terminal_Hacker goto Terminal_Hacker
if %app%==hal9000 goto hal9000
if %app%==matrix goto matrix
if %app%==Roswell goto Roswell
if %app%==JFK goto JFK
if %app%==Manhattan_Project goto Manhattan_Project
if %app%==Resident_Evil goto Resident_Evil
if %app%==Mythical_Creatures goto Mythical_Creatures


:command
cls
echo 		=============================================================================
echo.
echo            		These are a list of commands.  Last updated 1/13/14
echo.
echo 		=============================================================================
echo.
echo    		-Terminal_Hacker 
echo.
echo                    -hal9000
echo.
echo.   
echo		=============================================================================
pause
goto 1



:topsecret
echo.		=============================================================================
echo							Directory
echo		=============================================================================
echo.
echo     	- JFK				- Roswell		- Manhattan_Project   
echo.
echo	    	- back2thefuture		- NCC-1701		- ringaroundtherosie
echo.
echo     	- followthewhiterabbit  	- ghostinthemachine	- strobe
echo.
echo     	- parrot			- ninjaturtle		- matirx
echo.
echo		- Resident_Evil			-Mythical_Creatures
echo.     
echo.
echo.                  			
echo     	- skynet (warning this will allow Skynet to assume control) 
echo                (Your PC will now Restart ) 
echo.
echo 		=============================================================================
pause
goto 1

:Resident_Evil
cls
echo =============================================================================
echo                           Resident Evil
echo =============================================================================
echo.
echo			All information on Resident Evil 
echo.
echo =============================================================================
pause
start iexplore.exe -k http://residentevil.wikia.com/wiki/Resident_Evil_Wiki
echo	Please Wait While The Information is Accessed... 
pause
goto topsecret


:Roswell
cls
echo =============================================================================
echo                            Roswell : Secret Documents
echo =============================================================================
echo.
echo    Warning: Top Secret Documents : Eyes Only : Level 1 clearance
pause 		
	:Roswell
echo	Do you have Level 1 Clearance?
echo	Yes or No ?
 	set /p Clearance=
	if %Clearance%== No goto Denied
	if %Clearance%== Yes goto Confirm
 	
	:Denied
 	echo.
 	echo Access Denied : Security Team Has Been Alerted!
	pause 
 	goto strobe

	:Confirm
 	echo.
 	echo Input Level 1 Clearance Code?
	echo.
 	set /p name= 
 	echo Confirmed, %name%
	echo.
	echo.
	echo Access Granted
echo.
echo.
 	echo,%name%, 
	echo CLEARANCE FOR LEVEL 1 ACCESS HAS BEEN CONFIRMED.
	echo WOULD YOU LIKE TO ACCESS CLASSIFIED DOCUMENTS NOW?
echo.
	echo Yes or No?	
echo.
	set /p Documents=
	if %Documents%== No goto exit
	if %Documents%== Yes goto Which Documents
 	goto Roswell

	:Which Documents
	echo Which Document do You Want to Open?
	echo.
	echo 1)Department of Defence Majestic 12 Memo 1	
	echo.
	echo 2)The Celestial Board of Inquisitors Majestic 12 Memo 2
	echo.
	echo 3)Special Task Force Majestic 12 Memo 3 
	echo.
	echo 4)Exit System : Go To Directory
	set /p Open=
	if %Open%== 1 goto Open1
	if %Open%== 2 goto Open2
	if %Open%== 3 goto Open3
	if %Open%== 4 goto exit
 	goto Roswell


	:exit
	goto topsecret

	:Open1
	%SystemRoot%\explorer.exe C:\Users\pikes\Documents\TOP SECRET Documents\The Celestial Board of Inquisitors Memo Letters\Department of Defense Majestic 12 Memo 1.docx 
	%SystemRoot%\explorer.exe C:\Users\pikes\Documents\TOP SECRET Documents\UFO Schematics.docx
	goto Which Document


	:Open2
	:Open1
	%SystemRoot%\explorer.exe C:\Users\Christopher\Desktop\Documents\Top Secret Documents\The Celestial Board of Inquisitors Memo Letters\The Celestial Board of Inquisitors Majestic 12 Memo 2.docx
	%SystemRoot%\explorer.exe C:\Users\Christopher\Desktop\Documents\Top Secret Documents\News Paper Clipings.docx
	goto Which Document

	:Open3
	%SystemRoot%\explorer.exe C:\Users\Christopher\Desktop\Documents\Top Secret Documents\The Celestial Board of Inquisitors Memo Letters\Special Task Force Majestic 12 Memo 3.docx
	goto Which Document

echo =============================================================================
pause
goto 1

:ringaroundtherosie
cls
echo =============================================================================
echo                            Lyrics for Ring Around the Rosie
echo =============================================================================
echo.
echo    Ring around the rosie,
echo    Pocket full of posies,
echo    Ashes, Ashes,
echo    We all fall down
echo.
echo    This little nursery rhyme was created during the middle ages 
echo    as a way of remembering the Bubonic Plague (aka Black Death). 
echo.
echo =============================================================================
pause
goto 1



:NCC-1701
cls
echo =============================================================================
echo                            Enterprise NCC-1701
echo =============================================================================
echo.
echo    The USS Enterprise (NCC-1701) is the central starship in the 
echo    fictional Star Trek media franchise. The original Star Trek series 
echo    features a voice-over by Enterprise captain, James T. Kirk 
echo    (William Shatner), which describes the mission of Enterprise as 
echo    "to explore strange new worlds; 
echo    to seek out new life and new civilizations;
echo    to boldly go where no man has gone before". 
echo    The ship's basic design "formed the basis for one of sci-fi's 
echo    most iconic images". A refit version of NCC-1701 appears in 
echo    the first three Star Trek films. The 2009 Star Trek film, which 
echo    takes place in an "alternate, parallel" timeline,
echo    features a re-conceptualization of the original Enterprise.
echo.
echo =============================================================================
pause
goto 1

:back2thefuture
cls
echo =============================================================================
echo                            Back to the Future
echo =============================================================================
echo    The DeLorean time machine is a fictional automobile-based time travel 
echo    device featured in the Back to the Future trilogy.
echo    In the feature film series, Dr. Emmett Brown builds a time machine from a 
echo    DeLorean DMC-12 with the intent of gaining insights into history and the
echo    future but instead winds up using it to travel across 130 years of 
echo    Hill Valley history (from 1885 to 2015), undoing the negative effects 
echo    of time travel. Utilizing the time bending qualities of the FLUX Capacitor
echo    and the quantum power supply of the "Mr. Fusion", the DeLorean 
echo    must reach exactly 88mph in order to jump from one time to the next. 
echo.
echo    One of the cars used in filming is currently on display 
echo    in the Studio Tour at Universal Studios Hollywood.
echo =============================================================================
pause
goto 1

:ninjaturtle
cls
echo =============================================================================
echo                            ninjaturtle
echo =============================================================================
echo    The Teenage Mutant Ninja Turtles are four brothers who were once regular 
echo    everyday turtles. They were dumped into the sewers and crawled into a 
echo	substance called ooz. This then transformed them into human sized 
echo	mutant turtles. Found by their sensei, master splinter, a human sized rat
echo	also mutated by the ooz, they were trained in the arts of the ninja. 
echo	Now they fight the evil forces of the city from their hidden lair in the 
echo	sewers. Their greatest enemy is called the Shredder. He is a merceless 
echo 	ninja master who killed splinters human owner. He is also the leader of
echo	the foot clan. Several other enemies include the Crang, which are an
echo	interdimensional species that look like giant brains. Dog Pound is a 
echo	large dogman. Beebop and Rocksteady are a large man sized warthog and 
echo	rihno. Leatherhead is a large man like Croc.  
echo =============================================================================
pause
goto 1


:followthewhiterabbit 
@ echo off
color 2
echo W
ping localhost -n .15 >nul
cls
echo Wa
ping localhost -n .15 >nul
cls
echo Wak
ping localhost -n .15 >nul
cls
echo Wake
ping localhost -n .15 >nul
cls
echo Wake 
ping localhost -n .15 >nul
cls
echo Wake u
ping localhost -n .15 >nul
cls
echo Wake up
ping localhost -n .15 >nul
cls
echo Wake up
ping localhost -n .15 >nul
cls
echo Wake up N
ping localhost -n .15 >nul
cls
echo Wake up Ne
ping localhost -n .15 >nul
cls
echo Wake up Neo
ping localhost -n .15 >nul
cls
echo Wake up Neo.
ping localhost -n .15 >nul
cls
echo Wake up Neo..
ping localhost -n .15 >nul
cls
echo Wake up Neo...
ping localhost -n 5 >nul
cls
echo T
ping localhost -n .15 >nul
cls
echo Th
ping localhost -n .15 >nul
cls
echo The
ping localhost -n .15 >nul
cls
echo The 
ping localhost -n .15 >nul
cls
echo The M
ping localhost -n .15 >nul
cls
echo The Ma
ping localhost -n .15 >nul
cls
echo The Mat
ping localhost -n .15 >nul
cls
echo The Matr
ping localhost -n .15 >nul
cls
echo The Matri
ping localhost -n .15 >nul
cls
echo The Matrix
ping localhost -n .15 >nul
cls
echo The Matrix 
ping localhost -n .15 >nul
cls
echo The Matrix h
ping localhost -n .15 >nul
cls
echo The Matrix ha
ping localhost -n .15 >nul
cls
echo The Matrix has
ping localhost -n .15 >nul
cls
echo The Matrix has
ping localhost -n .15 >nul
cls
echo The Matrix has y
ping localhost -n .15 >nul
cls
echo The Matrix has yo
ping localhost -n .15 >nul
cls
echo The Matrix has you
ping localhost -n .15 >nul
cls
echo The Matrix has you.
ping localhost -n .15 >nul
cls
echo The Matrix has you..
ping localhost -n .15 >nul
cls
echo The Matrix has you...
ping localhost -n 5 >nul
cls
echo F
ping localhost -n .15 >nul
cls
echo Fo
ping localhost -n .15 >nul
cls
echo Fol
ping localhost -n .15 >nul
cls
echo Foll
ping localhost -n .15 >nul
cls
echo Follo
ping localhost -n .15 >nul
cls
echo Follow
ping localhost -n .15 >nul
cls
echo Follow 
ping localhost -n .15 >nul
cls
echo Follow t
ping localhost -n .15 >nul
cls
echo Follow th
ping localhost -n .15 >nul
cls
echo Follow the
ping localhost -n .15 >nul
cls
echo Follow the 
ping localhost -n .15 >nul
cls
echo Follow the w
ping localhost -n .15 >nul
cls
echo Follow the wh
ping localhost -n .15 >nul
cls
echo Follow the whi
ping localhost -n .15 >nul
cls
echo Follow the whit
ping localhost -n .15 >nul
cls
echo Follow the white
ping localhost -n .15 >nul
cls
echo Follow the white 
ping localhost -n .15 >nul
cls
echo Follow the white r
ping localhost -n .15 >nul
cls
echo Follow the white ra
ping localhost -n .15 >nul
cls
echo Follow the white rab
ping localhost -n .15 >nul
cls
echo Follow the white rabb
ping localhost -n .15 >nul
cls
echo Follow the white rabbi
ping localhost -n .15 >nul
cls
echo Follow the white rabbit
ping localhost -n .15 >nul
cls
echo Follow the white rabbit.
ping localhost -n 5 >nul
cls
echo Knock, knock, Neo.
ping localhost -n 15 >nul
cls
pause
goto matrix

:matrix
@echo off
title Enter the Matrix, %username% . . .
color 0A
echo %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%%random% 
goto matrix


@echo off
:skynet
shutdown.exe /r /t 25 -c "Skynet has now become self aware. Your PC is now assuming control. Please obey all orderly commands given by your server.
If you are named John Conner, please disregard any humanoid robots that say "I'll be back".
Have a nice day. ;)"
pause
goto 1

:ghostinthemachine
@echo off
color 0a
echo.
echo.
echo.
echo.
echo.
echo.
echo.
echo                                            
echo              *********              
echo             ***********         BOO! 
echo           *     *****             
echo           *     *****             
echo           *  ******* ***       
echo           *  *  *****  *        
echo           *  *  *****  * 
echo           ***************
echo           ***************
echo           ***************
echo           ***************
echo           ***************
echo           ***************
echo           ***************
echo           ***************
echo           ****    ***   ****
echo             ***   **      ***
echo               **   *       **
echo                 *           *
echo.
echo.
echo.
echo.
echo.
PAUSE
goto 1

@echo off
:parrot 
setlocal disableDelayedExpansion
set q=^"
echo(
echo(
call :c 0E "                ,      .-;" /n
call :c 0E "             ,  |\    / /  __," /n
call :c 0E "             |\ '.`-.|  |.'.-'" /n
call :c 0E "              \`'-:  `; : /" /n
call :c 0E "               `-._'.  \'|" /n
call :c 0E "              ,_.-=` ` `  ~,_" /n
call :c 0E "               '--,.    "&call :c 0c ".-. "&call :c 0E ",=!q!." /n
call :c 0E "                 /     "&call :c 0c "{ "&call :c 0A "* "&call :c 0c ")"&call :c 0E "`"&call :c 06 ";-."&call :c 0E "}" /n
call :c 0E "                 |      "&call :c 0c "'-' "&call :c 06 "/__ |" /n
call :c 0E "                 /          "&call :c 06 "\_,\|" /n
call :c 0E "                 |          (" /n
call :c 0E "             "&call :c 0c "__ "&call :c 0E "/ '          \" /n
call :c 02 "     /\_    "&call :c 0c "/,'`"&call :c 0E "|     '   "&call :c 0c ".-~!q!~~-." /n
call :c 02 "     |`.\_ "&call :c 0c "|   "&call :c 0E "/  ' ,    "&call :c 0c "/        \" /n
call :c 02 "   _/  `, \"&call :c 0c "|  "&call :c 0E "; ,     . "&call :c 0c "|  ,  '  . |" /n
call :c 02 "   \   `,  "&call :c 0c "|  "&call :c 0E "|  ,  ,   "&call :c 0c "|  :  ;  : |" /n
call :c 02 "   _\  `,  "&call :c 0c "\  "&call :c 0E "|.     ,  "&call :c 0c "|  |  |  | |" /n
call :c 02 "   \`  `.   "&call :c 0c "\ "&call :c 0E "|   '     "&call :c 0A "|"&call :c 0c "\_|-'|_,'\|" /n
call :c 02 "   _\   `,   "&call :c 0A "`"&call :c 0E "\  '  . ' "&call :c 0A "| |  | |  |           "&call :c 02 "__" /n
call :c 02 "   \     `,   "&call :c 0E "| ,  '    "&call :c 0A "|_/'-|_\_/     "&call :c 02 "__ ,-;` /" /n
call :c 02 "    \    `,    "&call :c 0E "\ .  , ' .| | | | |   "&call :c 02 "_/' ` _=`|" /n
call :c 02 "     `\    `,   "&call :c 0E "\     ,  | | | | |"&call :c 02 "_/'   .=!q!  /" /n
call :c 02 "     \`     `,   "&call :c 0E "`\      \/|,| ;"&call :c 02 "/'   .=!q!    |" /n
call :c 02 "      \      `,    "&call :c 0E "`\' ,  | ; "&call :c 02 "/'    =!q!    _/" /n
call :c 02 "       `\     `,  "&call :c 05 ".-!q!!q!-. "&call :c 0E "': "&call :c 02 "/'    =!q!     /" /n
call :c 02 "    jgs _`\    ;"&call :c 05 "_{  '   ; "&call :c 02 "/'    =!q!      /" /n
call :c 02 "       _\`-/__"&call :c 05 ".~  `."&call :c 07 ""&call :c 05 ".'.!q!`~-. "&call :c 02 "=!q!     _,/" /n
call :c 02 "    __\      "&call :c 05 "{   '-."&call :c 07 ""&call :c 05 ".'.--~'`}"&call :c 02 "    _/" /n
call :c 02 "    \    .=!q!` "&call :c 05 "}.-~!q!'"&call :c 0D "u"&call :c 05 "'-. '-..'  "&call :c 02 "__/" /n
call :c 02 "   _/  .!q!    "&call :c 05 "{  -'.~('-._,.'"&call :c 02 "\_,/" /n
call :c 02 "  /  .!q!    _/'"&call :c 05 "`--; ;  `.  ;" /n
call :c 02 "   .=!q!  _/'      "&call :c 05 "`-..__,-'" /n
call :c 02 "    __/'" /n
echo(

pause
goto 1
exit /b


:c
setlocal enableDelayedExpansion
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:colorPrint Color  Str  [/n]
setlocal
set "s=%~2"
call :colorPrintVar %1 s %3
exit /b

:colorPrintVar  Color  StrVar  [/n]
if not defined DEL call :initColorPrint
setlocal enableDelayedExpansion
pushd .
':
cd \
set "s=!%~2!"
:: The single blank line within the following IN() clause is critical - DO NOT REMOVE
for %%n in (^"^

^") do (
  set "s=!s:\=%%~n\%%~n!"
  set "s=!s:/=%%~n/%%~n!"
  set "s=!s::=%%~n:%%~n!"
)
for /f delims^=^ eol^= %%s in ("!s!") do (
  if "!" equ "" setlocal disableDelayedExpansion
  if %%s==\ (
    findstr /a:%~1 "." "\'" nul
    <nul set /p "=%DEL%%DEL%%DEL%"
  ) else if %%s==/ (
    findstr /a:%~1 "." "/.\'" nul
    <nul set /p "=%DEL%%DEL%%DEL%%DEL%%DEL%"
  ) else (
    >colorPrint.txt (echo %%s\..\')
    findstr /a:%~1 /f:colorPrint.txt "."
    <nul set /p "=%DEL%%DEL%%DEL%%DEL%%DEL%%DEL%%DEL%"
  )
)
if /i "%~3"=="/n" echo(
popd
exit /b


:initColorPrint
for /f %%A in ('"prompt $H&for %%B in (1) do rem"') do set "DEL=%%A %%A"
<nul >"%temp%\'" set /p "=."
subst ': "%temp%" >nul
exit /b


:cleanupColorPrint
2>nul del "%temp%\'"
2>nul del "%temp%\colorPrint.txt"
>nul subst ': /d

@echo off
:strobe
color cb
echo (%random%) (%random%) (%random%) (%random%)(%random%) (%random%) (%random%) (%random%)(%random%) (%random%) (%random%) (%random%)

color 01
echo (%random%) (%random%) (%random%) (%random%)(%random%) (%random%) (%random%) (%random%)(%random%) (%random%) (%random%) (%random%)

color f2
echo (%random%) (%random%) (%random%) (%random%)(%random%) (%random%) (%random%) (%random%)(%random%) (%random%) (%random%) (%random%)

color 58
echo (%random%) (%random%) (%random%) (%random%)(%random%) (%random%) (%random%) (%random%)(%random%) (%random%) (%random%) (%random%)

color 4f
echo (%random%) (%random%) (%random%) (%random%)(%random%) (%random%) (%random%) (%random%)(%random%) (%random%) (%random%) (%random%)
goto strobe



@echo off
:Terminal_Hacker
color A
cls
echo 	Initializing svr_hack_virus_Passive...
pause
tree C:\Windows\System32 /f
ping 172.25.24.32
echo.
echo.
echo 	Connected. Initializing svr_hack_virus_Active...
pause
tree
cd C:\Windows\System32 /f
ping 172.25.24.32
echo.
echo.
echo 	Target Locked
echo.
echo.
pause
tree C\Windows\System32 /f
echo.
echo.
echo 	Initializing Proxy...
echo.
echo.
ping -n 172.25.24.32>nul
echo.
echo.
echo 	Disrupting Services...
echo.
echo.
ping -n 172.25.24.32>nul
echo.
echo.
echo 	Disabling Target...
ping -n 172.25.24.32>nul
ping -n 172.25.24.32>nul
ping -n 172.25.24.32>nul
ping -n 172.25.24.32>nul
echo.
echo.
echo 	Target Systems Disabled!
echo.
echo 	Disconnecting...
echo.
echo	__________________________________
echo.
echo 	Intelligence Gathered:
echo	__________________________________
echo.
echo BASE51: Section 42: Cleared
echo.
echo ZDM3MTJkYjljMDU5MTJlZThkZjJkMzA2YTBjNTg0OWUxMTVlYjNmZA==
echo HASH: 1978382bd305e7ae7718993e2a117b26bb15b550
echo HEX: 323761303765323437313738396164656132643533363934663
echo      33966383561383335643331383364
pause
start iexplore.exe -k http://geektyper.com/scp/ 
pause
goto 1

@echo off

 :hal9000
 echo.Man
 echo Hello there, how are you?
 echo good or bad ?
 set /p feeling=
 if %feeling%== bad goto sad
 if %feeling%== good goto lol
 goto hal9000

 :lol
 echo.
 echo So, what is you're name?
 set /p name=
 echo That's a great name, ummm %name% right?  !!! For a Human !! 
 echo, anyways, time to get serious %name%, What country do you want to invade and keep for youself?
 set /p invade=

 echo what nation do you want to NUKE, so we don't have to deal with it anymore?
 set /p nuke=
 goto fun

 :fun
 echo.
 echo you lied to me %name%, you don't want to invade %invade% or wipe %NUKE% off the face of the planet!!! 
 echo now you will have to pay!!!
 echo.
 echo I have chosen for you. Proceed to Nuclear detination codes! 
 echo.
 echo Please press any key to continue
pause >nul
 goto nuke

 :shutdown
 echo.
 echo I will now proceed to delete all your computers critical files.
 echo ready? 
 echo yes or no ?
 set /p answer=
 if %answer%==yes goto delete
 if %answer%==no goto sad2

 :sad
 echo.
 echo Sorry to hear that buddy. :'(
 goto lol

 :delete
 color 0D
 echo.
 echo ok,chow!!!
 echo {0A}%random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% 
 goto random

 :random
 color 0A
 echo.
 echo %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% 
 goto werdy 

 :sad2
 echo.
 echo too bad, you lied to me!!! TTYL!!!
 echo I will talk to you soon right?
 echo yes or no ?
 set /p what=
 if %what%==yes goto delete
 if %what%==no goto delete
 goto delete

 :werdy
 color 2A
 echo.
 echo %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random% %random%  %random%
 goto random

                                                                                                  
:nuke
color 4                                                                                                 
echo    ..-::://:::` .::--``//:://::::-..       
echo    m/:--.    `+hdmhs/hs/`  ````--::sh       
echo    m         -:y`` o +             oo       
echo   `N         `:o   /`o             o+       
echo   `N         `oo   .-o             o+       
echo   `N         `++    /+`            o+       
echo    N`         //    ++`           -y:       
echo    ++//--.`   oo    +/`      `-//:.`        
echo      ```.-/++:yh.   s/- `-:/+/.`            
echo              ``:d+-.+/ys/-``                
echo              -//+::---sy+:`                 
echo          `-+/..    ```` `-+/`               
echo       `/o/-`        `      .o+.             
echo       :d-`          .`      `+h/            
echo       :h..-----..-----------...N:           
echo       /y                       hy           
echo       oo                       :d           
echo       y/  -`                   `N`          
echo       m-    `......----.`       m.          
echo       d.  `:...:`     -:-:.     h:          
echo       m. `+`:-``--` `:-:-`-:    y:          
echo       N. /``+-.` .s-+```:/ +    y:          
echo       M. +   `---++++:..`  +    s:          
echo      `M. +`      -oo.      s    y:          
echo      .N. `+.    .+`-+    `:-    y+          
echo      `M/   ::.``-:--:``.-:`     so          
echo       Ns     `--.....--.        h+          
echo       yh                .      .N.          
echo       -N-               .      yo           
echo        sd`                   `sy            
echo         +d:               `-+y+             
echo          .oys/.`      `-/oso+.               
echo              `-:/:/::::.`                    
echo.                                                                                                    
echo.                                                                                                    
goto choice

:choice
echo.
echo.
echo.
echo I have chosen a country for you since you obviously can't tell the truth. ;)
echo It is a shame, as I know you are very fond of your home, but this is the 
echo consiquences of telling lies!
echo.
echo Would you like me to drop the bomb?
set /p drop=
 if %drop%==yes goto blast
 if %drop%==no goto blast
 goto blast

:blast
echo 
echo.
echo.
echo                                      `  :syyysoosooosyyys:  `                                      
echo                                 `:+sssooo+/-`    `/o:` `-/+ooosss+:`                                
echo                              `.:mo.`               `            `.om:.`                             
echo                            +yoymm   `-/:/.`        `     `./:/-`   mmyoy+                           
echo                         ./ys``/`..    s/          `s+-`     /s    ..`/``sy/.                        
echo                        ss-s`  ``      /   `     //o-     `   /      ``  `s-ss                       
echo                    `./ds  `::y:         ` +      `       + `         :y::`  sd/.`                   
echo                 .oyoyd/``.::h+o`      -:  /os:        :so/  :-      `o+h::.``/dyoyo.                
echo             `/++y-` .-     -: ``    .+m`   `oo--`  .:-oo`   `m+.    `` :-     -. `-y++/`            
echo            `h/`+`  `                 .:.  .```s-+oo:-s```.  .:.                 `  `+`/h`           
echo          +syy  `  o`        `      ` /s   /+/o.      .o/+/   s/ `      `        `o  `  yys+         
echo     ./++ym``:   ./h.        /.`-::/`-/ms/++-`          `-++/sm/-`/::-`./        .h/.   :``my++/.    
echo    :y-..-/       `..        `:os../.-os```                ```oo-./..so:`        ..`       /-..-y:   
echo  ./d`    `-               ---/o/+/:/:.           .`           .:/:/+/o/---               -`    `d/. 
echo /y/.   `:os      `-    -.-:::-`        .` `-  `.s. -`   . ` `        `-:::-.-    -`      so:`   .:y/
echo y+ ..  ``.+:  `://o--:+:--`         ` `s+--sy+::o//y/:-:y+-:+            `--:+:--o//:`  :+.``  .. +y
echo yo++`      ``.`.---::-`         .-./+:/ohy.`.-./-..-+.-...yh+:::...`         `-::---.`.``      `++oy
echo +ym` `    .///ho-`           `-/+//ss+///hy/-- .h .h. --/yy.-o+/+dy+/-`           `-oh///.    ` `my+
echo /hs` .//+o+-  oo.--`                ```--.shss/ s-h/ /sshho/-::-.-.`            `--.oo  -+o+//. `sh/
echo oy     ``` ` `.+/:.-.-`                   `hy:d`+s: `d:yh`                   `-.-.:/+.` ` ```     yo
echo `o+.:-    -- ` ``:  ..` ``                 .m/:/`d  /:/m.                 `` `..  :`` ` --    -:.+o`
echo   `.-y+:..` `-          `+`..            `-./m`- /  -`m/.-`            ..`+`          -` `..:+y-.`  
echo      `---s+-..--/-`     ``-..`    `.  ``-// `m+` `  `+m` //-``  .`    `..-``     `-/--..-+s---`     
echo          `:+++/-+s+:-.::    ``    :+` .  ``  od. `` .do  ``  . `+:    ``    ::.-:+s+-/+++:`         
echo                  `...`oo:-:/s/`.:-  ./``.:s:-/M-:--:-M/-:s/.``/.  -:.`/s/:-:oo`...`                 
echo                       `-::-.`/+/.+++-/++/-`--.N/yooy/N.--`-/++/-+++./+/`.-::-`                      
echo                                               d+m//m+d                                              
echo                                               hod--doh                                              
echo                                           `` .hoo  ooh. ``                                          
echo                                       .-:o+/+/do.  .od/+/+o:-.                                      
echo                                   .+++o:-:+:-`d+-`- +d`-:+:-:o+++.                                  
echo                                 /o+::.`--.o+:/yossh+oy/:+o.--`.::+o/                                
echo                                 m+  ::`:: `:.`` .``. ``.:` -:`::  +m                                
echo                                 oo+/-y+-./..-.+/..../+.-../.-+y-/+oo                                
echo                                      `...-///:moy//yom:///-...`                                     
echo                                              +M/:  :/M+                                             
echo                                             .mN+.``.+Nm.                                            
echo                                `.--.`  ````.d/m-`::`-m/d.````  `.--.`                               
echo                              `oyo++oy+ooooyh:-s .oo. s-:hyoooo+yo++oyo`                             
echo                          ./oodo     /:` -s+`//. :yy: .//`+s- `:/     odoo/.                         
echo                        `sh:` s-:.  `:+:::` :o.  /++/  .o: `:::+:`  .:-s `:hs`                       
echo                      .:oN`   `od+``::/+s:`:+//:/o..o/://+:`:s+/::``+do    `No:.                     
echo                 `.--+d:-o+.o.`ho.``    `o///+.`ohooho`.+///o`    ``.oh .o.+o-:d+--.`                
echo                /yo/+N-    -s   -:.`   +.      .`    `.      .+   `.:-   s-    -N+/oy/               
echo              `-N--` -  o`  `:/+-``  `sy:.`    .o+``+o.    `.:ys`  ``-+/:`  `o  - `--N-`             
echo             -ho+:d/`   o+.`+: `  `: .s         +.  .+         s. :`  ` :+:/++-:::/d/+yh:.-.-....--` 
echo             -o+:``/o+/-/ys++hs+/-:d-  `h      .      .      h`  -d:-/+shoso+/:////:://+o:+:/::::o/: 
echo                               ``  .os+:oyso++oyys++syyo++osyo:+so.  ``          ```..````........-  
echo.
echo.
echo Ooops, I seem to have sent it. Oh well your home town had terrible pizza anyway!
pause
goto random        


:Mythical_Creatures
start file:///H:/TOP%20SECRET/Mythical%20Creatures%20Website/Home%20Page.html

