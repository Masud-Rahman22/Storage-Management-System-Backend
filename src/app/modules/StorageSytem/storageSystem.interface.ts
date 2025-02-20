import { Types } from "mongoose"

export type TFileTypes = "PDF" | "Image" | "Document"
export type TFolder = {
    _id : Types.ObjectId;
    userID:Types.ObjectId;
    folderName : string;
    access : Types.ObjectId[];
    parent : Types.ObjectId;
    isFavorite: boolean;
    isSecured: boolean;
    isDeleted: boolean;
}

export type TFile = {
    _id : Types.ObjectId;
    name : string;
    uniqueFileName : string;
    path : string;
    dataType : TFileTypes,
    fileSize : number,
    isFavorite: boolean;
    isSecured: boolean;
    isDeleted: boolean;
    userID:Types.ObjectId;
    folderID:Types.ObjectId;
    access : Types.ObjectId[];
}

export type info = {
    userID : Types.ObjectId; 
    parentFolderID : Types.ObjectId;
    allowedUser : Types.ObjectId[];
    isSecured : boolean;
}