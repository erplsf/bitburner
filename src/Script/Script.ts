// Class representing a script file
// This does NOT represent a script that is actively running and
// being evaluated. See RunningScript for that
import { calculateRamUsage } from "./RamCalculations";
import { IPlayer } from "../PersonObjects/IPlayer";
import { Page,
         routing } from "../ui/navigationTracking";

import { setTimeoutRef } from "../utils/SetTimeoutRef";
import { Generic_fromJSON,
         Generic_toJSON,
         Reviver } from "../../utils/JSONReviver";
import { roundToTwo } from "../../utils/helpers/roundToTwo";

export class Script {
    // Initializes a Script Object from a JSON save state
    static fromJSON(value: any): Script {
        return Generic_fromJSON(Script, value.data);
    }

    // Code for this script
    code: string = "";

    // Filename for the script file
    filename: string = "";

    // The dynamic module generated for this script when it is run.
    // This is only applicable for NetscriptJS
    module: any = "";

    // Amount of RAM this Script requres to run
    ramUsage: number = 0;

    // IP of server that this script is on.
	server: string = "";


    constructor(fn: string = "", code: string = "", server: string = "") {
    	this.filename 	= fn;
        this.code       = code;
        this.ramUsage   = 0;
    	this.server 	= server; // IP of server this script is on
        this.module     = "";
        if (this.code !== "") {this.updateRamUsage();}
    };

    download(): void {
        const filename = this.filename + ".js";
        const file = new Blob([this.code], {type: 'text/plain'});
        if (window.navigator.msSaveOrOpenBlob) {// IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        } else { // Others
            var a = document.createElement("a"),
                    url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeoutRef(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }

    // Save a script FROM THE SCRIPT EDITOR
    saveScript(code: string, p: IPlayer): void {
    	if (routing.isOn(Page.ScriptEditor)) {
    		//Update code and filename
    		this.code = code.replace(/^\s+|\s+$/g, '');

            const filenameElem: HTMLInputElement | null = document.getElementById("script-editor-filename") as HTMLInputElement;
            if (filenameElem == null) {
                console.error(`Failed to get Script filename DOM element`);
                return;
            }
    		this.filename = filenameElem!.value;

    		// Server
    		this.server = p.currentServer;

    		//Calculate/update ram usage, execution time, etc.
    		this.updateRamUsage();

            this.module = "";
    	}
    }

    // Updates the script's RAM usage based on its code
    async updateRamUsage() {
        // TODO Commented this out because I think its unnecessary
        // DOuble check/Test
        // var codeCopy = this.code.repeat(1);
        var res = await calculateRamUsage(this.code);
        if (res !== -1) {
            this.ramUsage = roundToTwo(res);
        }
    }

    // Serialize the current object to a JSON save state
    toJSON(): any {
        return Generic_toJSON("Script", this);
    }
}

Reviver.constructors.Script = Script;
