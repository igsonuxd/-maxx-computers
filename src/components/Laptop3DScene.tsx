"use client";

export default function Laptop3DScene() {
  return (
    <div className="w-full h-[320px] sm:h-[380px] md:h-[600px] flex items-center justify-center overflow-hidden">
      <div
        className="
          relative
          w-[320px] h-[245px]
          sm:w-[390px] sm:h-[295px]
          md:w-[620px] md:h-[430px]
        "
      >
        {/* Shadow */}
        <div
          className="
            absolute
            bottom-[15px]
            sm:bottom-[20px]
            md:bottom-[25px]
            left-1/2
            -translate-x-1/2
            w-[270px]
            sm:w-[340px]
            md:w-[520px]
            h-[30px]
            sm:h-[38px]
            md:h-[45px]
            rounded-[50%]
            bg-black/50
            blur-xl
            md:blur-2xl
          "
        />

        {/* SCREEN */}
        <div
          className="
            absolute
            left-1/2
            -translate-x-1/2
            top-[5px]
            w-[245px]
            h-[155px]
            sm:w-[300px]
            sm:h-[190px]
            md:w-[470px]
            md:h-[300px]
            rounded-[12px]
            sm:rounded-[15px]
            md:rounded-[18px]
            bg-gradient-to-br
            from-zinc-300
            via-zinc-700
            to-zinc-900
            p-[5px]
            sm:p-[6px]
            md:p-[8px]
            shadow-2xl
          "
        >
          {/* Display */}
          <div
            className="
              relative
              w-full
              h-full
              rounded-[9px]
              sm:rounded-[11px]
              md:rounded-[12px]
              bg-black
              overflow-hidden
              flex
              items-center
              justify-center
            "
          >
            {/* Screen background */}
            <div
              className="
                absolute
                inset-0
                bg-gradient-to-br
                from-zinc-900
                via-black
                to-zinc-950
              "
            />

            {/* MAXX COMPUTERS */}
            <div className="relative text-center px-2">
              <div
                className="
                  text-[18px]
                  sm:text-[24px]
                  md:text-[38px]
                  font-black
                  tracking-[-1.5px]
                  md:tracking-[-2px]
                "
              >
                <span className="text-white">MAXX</span>
                <span className="text-zinc-500">COMPUTERS</span>
              </div>

              <div
                className="
                  mt-1
                  md:mt-2
                  text-[6px]
                  sm:text-[8px]
                  md:text-[11px]
                  tracking-[2px]
                  sm:tracking-[3px]
                  md:tracking-[4px]
                  text-zinc-500
                "
              >
                PREMIUM COMPUTING
              </div>
            </div>

            {/* Reflection */}
            <div
              className="
                absolute
                -top-20
                -left-16
                sm:-left-20
                w-[120px]
                sm:w-[160px]
                md:w-[200px]
                h-[300px]
                md:h-[450px]
                rotate-[35deg]
                bg-white/5
              "
            />
          </div>
        </div>

        {/* Camera */}
        <div
          className="
            absolute
            top-[9px]
            sm:top-[11px]
            md:top-[17px]
            left-1/2
            -translate-x-1/2
            w-[3px]
            h-[3px]
            md:w-[5px]
            md:h-[5px]
            rounded-full
            bg-zinc-500
            z-10
          "
        />

        {/* LAPTOP BASE */}
        <div
          className="
            absolute
            left-1/2
            -translate-x-1/2
            bottom-[30px]
            sm:bottom-[38px]
            md:bottom-[48px]
            w-[285px]
            h-[75px]
            sm:w-[355px]
            sm:h-[90px]
            md:w-[570px]
            md:h-[135px]
            rounded-b-[16px]
            sm:rounded-b-[20px]
            md:rounded-b-[25px]
            rounded-t-[5px]
            sm:rounded-t-[7px]
            md:rounded-t-[8px]
            bg-gradient-to-br
            from-zinc-400
            via-zinc-200
            to-zinc-600
            shadow-2xl
            perspective-[900px]
            rotateX-[8deg]
          "
        >
          {/* Keyboard */}
          <div
            className="
              absolute
              top-[9px]
              sm:top-[12px]
              md:top-[15px]
              left-1/2
              -translate-x-1/2
              w-[220px]
              h-[39px]
              sm:w-[280px]
              sm:h-[50px]
              md:w-[450px]
              md:h-[70px]
              rounded-md
              bg-zinc-900
              p-[7px]
              sm:p-[9px]
              md:p-3
              shadow-inner
            "
          >
            <div
              className="
                grid
                grid-cols-12
                gap-[2px]
                sm:gap-[3px]
                md:gap-[5px]
              "
            >
              {Array.from({ length: 48 }).map((_, i) => (
                <div
                  key={i}
                  className="
                    h-[3px]
                    sm:h-[4px]
                    md:h-[7px]
                    rounded-[1px]
                    md:rounded-[2px]
                    bg-zinc-700
                  "
                />
              ))}
            </div>
          </div>

          {/* Trackpad */}
          <div
            className="
              absolute
              bottom-[5px]
              sm:bottom-[7px]
              md:bottom-[8px]
              left-1/2
              -translate-x-1/2
              w-[60px]
              h-[18px]
              sm:w-[85px]
              sm:h-[24px]
              md:w-[125px]
              md:h-[35px]
              rounded-md
              border
              border-zinc-400
              bg-zinc-300/60
            "
          />

          {/* Front edge */}
          <div
            className="
              absolute
              bottom-0
              left-1/2
              -translate-x-1/2
              w-[305px]
              sm:w-[375px]
              md:w-[610px]
              h-[5px]
              sm:h-[6px]
              md:h-[8px]
              rounded-full
              bg-gradient-to-r
              from-zinc-500
              via-white
              to-zinc-500
            "
          />
        </div>

        {/* MAXX badge */}
        <div
          className="
            absolute
            bottom-[35px]
            sm:bottom-[44px]
            md:bottom-[58px]
            left-1/2
            -translate-x-1/2
            text-[5px]
            sm:text-[7px]
            md:text-[10px]
            font-bold
            tracking-[2px]
            md:tracking-[3px]
            text-zinc-600
          "
        >
          MAXX
        </div>
      </div>
    </div>
  );
}