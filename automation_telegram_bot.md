# Adding BOS-Telegram Bot to your startup scripts

Joko explains in his guide [Jokos Guide](https://btc21.de/lightning-node-bot/) how to setup your Telegram Bot on the raspiblitz. Its very good and because I just added it to my startup routing
I want to share it.

Automation is only possbile if you have set up the connection to the telegram bot before, so you don't have to paste the Telegram API Token anymore.

I will use the Systemd Software Manger Tool (part of every linux distribution) to do this. I want to avoid any complicated details and jump in:

##Checklist

1. Login via ssh as admin: `ssh admin@ip.ip.ip.ip`
2. Change to the following directory: `cd /etc/systemd/system/`
3. create a so called unit-file: `sudo touch bos-telegram.service`
4. open file with: `sudo nano bos-telegram.service`
5. copy the following content into it, change VERBINDUNGSCODE with your own code:
    ```# Systemd unit for Bos-Telegram Bot
    # /etc/systemd/system/bos-telegram.service

    [Unit]
    Description=bos-telegram
    Wants=lnd.service
    After=lnd.service


    [Service] 
    ExecStart=/home/bos/.npm-global/bin/bos telegram--connect VERBINDUNGSCODE
    User=bos
    Restart=always
    TimeoutSec=120
    RestartSec=30
    StandardOutput=null
    StandardError=journal

    [Install]
    WantedBy=multi-user.target 
 6. save file and then type the following command in the terminal: `sudo systemctl enable bos-telegram.service`
 7. reboot your node
 8. wait until your telegram bot shows the new connection to check whether the service is running properly you can type: `sudo systemctl status  bos-telegram.service`

